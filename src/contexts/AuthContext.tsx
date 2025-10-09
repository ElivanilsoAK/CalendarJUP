import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db 
} from '../firebase/config';
import { 
  type User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { logLoginSuccess, logOrganizationCreated } from '../firebase/analytics';

interface UserOrgInfo {
  orgId: string;
  name: string;
  code: string;
  role: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentUserOrg: UserOrgInfo | null;
  userOrgs: UserOrgInfo[];
  loading: boolean;
  signup: (email: string, pass: string, name: string, orgCode?: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (orgCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (orgId: string) => void;
  createOrganization: (orgName: string) => Promise<void>;
  leaveOrganization: (orgId: string) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
  refreshAuthContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserOrg, setCurrentUserOrg] = useState<UserOrgInfo | null>(null);
  const [userOrgs, setUserOrgs] = useState<UserOrgInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const generateOrgCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const getOrgIdFromCode = async (orgCode: string): Promise<string | null> => {
    const orgsRef = collection(db, 'organizations');
    const q = query(orgsRef, where("code", "==", orgCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].id;
  }

  const signup = async (email: string, pass: string, name: string, orgCode?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: name,
      createdAt: serverTimestamp(),
    });

    let orgIdToJoin: string;
    let role = 'user';

    if (orgCode) {
      const existingOrgId = await getOrgIdFromCode(orgCode);
      if (!existingOrgId) {
        throw new Error("Organização não encontrada com o código fornecido.");
      }
      orgIdToJoin = existingOrgId;
    } else {
      const newOrgRef = doc(collection(db, 'organizations'));
      const newCode = generateOrgCode();
      await setDoc(newOrgRef, {
        name: `Organização de ${name}`,
        owner: user.uid,
        code: newCode,
        createdAt: serverTimestamp(),
      });
      orgIdToJoin = newOrgRef.id;
      role = 'admin'; // First user is admin
      logOrganizationCreated(orgIdToJoin);
    }

    const memberRef = doc(db, 'organizations', orgIdToJoin, 'members', user.uid);
    await setDoc(memberRef, { 
      email: user.email,
      role: role,
      status: 'active',
      joinedAt: serverTimestamp(),
    });
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    logLoginSuccess();
  };

  const loginWithGoogle = async (orgCode?: string) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (additionalInfo?.isNewUser || !userDoc.exists()) {
      await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Usuário sem nome',
          avatarUrl: user.photoURL,
          createdAt: serverTimestamp(),
      });

      let orgIdToJoin: string;
      let role = 'user';

      if (orgCode) {
        const existingOrgId = await getOrgIdFromCode(orgCode);
        if (!existingOrgId) {
          throw new Error("Organização não encontrada. Verifique o código e tente novamente.");
        }
        orgIdToJoin = existingOrgId;
      } else {
        const newOrgRef = doc(collection(db, 'organizations'));
        const newCode = generateOrgCode();
        await setDoc(newOrgRef, {
            name: `${user.displayName || 'Usuário'}'s Organization`,
            owner: user.uid,
            code: newCode,
            createdAt: serverTimestamp(),
        });
        orgIdToJoin = newOrgRef.id;
        role = 'admin';
        logOrganizationCreated(orgIdToJoin);
      }
      
      const memberRef = doc(db, 'organizations', orgIdToJoin, 'members', user.uid);
      await setDoc(memberRef, { 
        email: user.email,
        role: role,
        status: 'active',
        joinedAt: serverTimestamp(),
      });
    }
    logLoginSuccess();
  }

  const logout = async () => {
    await signOut(auth);
    setCurrentUserOrg(null);
    setUserOrgs([]);
  };

  const switchOrg = (orgId: string) => {
    const newOrg = userOrgs.find(org => org.orgId === orgId);
    if (newOrg) {
      setCurrentUserOrg(newOrg);
    }
  };

  const leaveOrganization = async (orgId: string) => {
    if (!currentUser) throw new Error("Usuário não autenticado.");

    // Remove user from organization members
    const memberRef = doc(db, 'organizations', orgId, 'members', currentUser.uid);
    await deleteDoc(memberRef);

    // Update user document to remove organization
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentOrgs = userData.organizations || [];
      const updatedOrgs = currentOrgs.filter((id: string) => id !== orgId);
      
      await updateDoc(userDocRef, {
        organizations: updatedOrgs,
        updatedAt: serverTimestamp()
      });
    }

    // Refresh auth context
    await fetchUserAndOrgData(currentUser);
  };

  const deleteOrganization = async (orgId: string) => {
    if (!currentUser) throw new Error("Usuário não autenticado.");

    // Check if user is owner
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists() || orgDoc.data().owner !== currentUser.uid) {
      throw new Error("Apenas o proprietário pode excluir a organização.");
    }

    // Delete all subcollections first
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    const deletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    const calendarsRef = collection(db, 'organizations', orgId, 'calendars');
    const calendarsSnapshot = await getDocs(calendarsRef);
    const deleteCalendarPromises = calendarsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteCalendarPromises);

    // Delete the organization
    await deleteDoc(orgRef);

    // Update user document to remove organization
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentOrgs = userData.organizations || [];
      const updatedOrgs = currentOrgs.filter((id: string) => id !== orgId);
      
      await updateDoc(userDocRef, {
        organizations: updatedOrgs,
        updatedAt: serverTimestamp()
      });
    }

    // Refresh auth context
    await fetchUserAndOrgData(currentUser);
  };

  const createOrganization = async (orgName: string) => {
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const newOrgRef = doc(collection(db, 'organizations'));
    const newCode = generateOrgCode();
    const newOrgData = {
      name: orgName,
      owner: currentUser.uid,
      code: newCode,
      createdAt: serverTimestamp(),
    };
    await setDoc(newOrgRef, newOrgData);
    logOrganizationCreated(newOrgRef.id);

    const memberRef = doc(db, 'organizations', newOrgRef.id, 'members', currentUser.uid);
    await setDoc(memberRef, { 
      email: currentUser.email,
      role: 'owner', // Changed from 'admin' to 'owner'
      status: 'active',
      joinedAt: serverTimestamp(),
    });

    // Update user document with the new organization
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentOrgs = userData.organizations || [];
      if (!currentOrgs.includes(newOrgRef.id)) {
        await updateDoc(userDocRef, {
          organizations: [...currentOrgs, newOrgRef.id],
          updatedAt: serverTimestamp()
        });
      }
    } else {
      // Create user document if it doesn't exist
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        organizations: [newOrgRef.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Refresh the auth context to reload organizations
    await fetchUserAndOrgData(currentUser);
  };

  const handlePendingInvite = async (user: User) => {
    const pendingInviteId = localStorage.getItem('pendingInviteId');
    if (!pendingInviteId) return;

    localStorage.removeItem('pendingInviteId');
    const inviteRef = doc(db, 'invites', pendingInviteId);
    const inviteDoc = await getDoc(inviteRef);

    if (inviteDoc.exists() && inviteDoc.data().status === 'pending') {
      const inviteData = inviteDoc.data();
      const memberRef = doc(db, 'organizations', inviteData.orgId, 'members', user.uid);
      
      // Check if user is already a member
      const memberDoc = await getDoc(memberRef);
      if (memberDoc.exists()) return;

      const batch = writeBatch(db);
      batch.set(memberRef, { 
        email: user.email,
        role: inviteData.role,
        status: 'active',
        joinedAt: serverTimestamp(),
      });
      batch.update(inviteRef, { status: 'accepted', acceptedBy: user.uid });
      await batch.commit();
    }
  };

  const fetchUserAndOrgData = async (user: User | null) => {
    if (user) {
      await handlePendingInvite(user);

      // Alternative approach: Get user's organizations from user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      const orgs: UserOrgInfo[] = [];
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If user has organizations stored in their document
        if (userData.organizations && Array.isArray(userData.organizations)) {
          for (const orgId of userData.organizations) {
            try {
              // Check if user is still a member
              const memberRef = doc(db, 'organizations', orgId, 'members', user.uid);
              const memberDoc = await getDoc(memberRef);
              
              if (memberDoc.exists()) {
                const orgRef = doc(db, 'organizations', orgId);
                const orgDoc = await getDoc(orgRef);
                
                if (orgDoc.exists()) {
                  const orgData = orgDoc.data();
                  orgs.push({
                    orgId: orgDoc.id,
                    name: orgData.name,
                    code: orgData.code,
                    role: memberDoc.data().role
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching organization ${orgId}:`, error);
            }
          }
        }
      }
      
      // Fallback: Search through all organizations (less efficient but works without indexes)
      if (orgs.length === 0) {
        try {
          const organizationsRef = collection(db, 'organizations');
          const orgsSnapshot = await getDocs(organizationsRef);
          
          for (const orgDoc of orgsSnapshot.docs) {
            const memberRef = doc(db, 'organizations', orgDoc.id, 'members', user.uid);
            const memberDoc = await getDoc(memberRef);
            
            if (memberDoc.exists()) {
              const orgData = orgDoc.data();
              orgs.push({
                orgId: orgDoc.id,
                name: orgData.name,
                code: orgData.code,
                role: memberDoc.data().role
              });
            }
          }
        } catch (error) {
          console.error('Error in fallback organization search:', error);
        }
      }

      setUserOrgs(orgs);
      if (orgs.length > 0) {
        // Check for a previously selected org in local storage
        const lastOrgId = localStorage.getItem('lastSelectedOrgId');
        const lastOrg = orgs.find(o => o.orgId === lastOrgId);
        setCurrentUserOrg(lastOrg || orgs[0]); 
      } else {
        setCurrentUserOrg(null);
      }
    } else {
      setCurrentUserOrg(null);
      setUserOrgs([]);
    }
  };

  const refreshAuthContext = async () => {
      if(currentUser){
        await fetchUserAndOrgData(currentUser);
      }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      await fetchUserAndOrgData(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Persist selected org
  useEffect(() => {
    if (currentUserOrg) {
      localStorage.setItem('lastSelectedOrgId', currentUserOrg.orgId);
    }
  }, [currentUserOrg]);

  const value = {
    currentUser,
    currentUserOrg,
    userOrgs,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    switchOrg,
    createOrganization,
    leaveOrganization,
    deleteOrganization,
    refreshAuthContext,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};