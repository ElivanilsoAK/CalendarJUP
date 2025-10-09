import { logEvent } from "firebase/analytics";
import { analytics } from "./config";

// Export logEvent for use in other services
export { logEvent };

// GA4 Custom Events

/**
 * Logs a successful login event.
 */
export const logLoginSuccess = () => {
  logEvent(analytics, "login_success");
};

/**
 * Logs an organization creation event.
 * @param {string} organizationId - The ID of the created organization.
 */
export const logOrganizationCreated = (organizationId: string) => {
  logEvent(analytics, "organization_created", {
    organization_id: organizationId,
  });
};

/**
 * Logs a calendar generation event.
 * @param {string} organizationId - The ID of the organization the calendar belongs to.
 */
export const logCalendarGenerated = (organizationId: string) => {
  logEvent(analytics, "calendar_generated", {
    organization_id: organizationId,
  });
};

/**
 * Logs a PDF export event.
 * @param {'complete' | 'individual'} type - The type of PDF export.
 * @param {string} organizationId - The ID of the organization.
 */
export const logPdfExport = (type: 'complete' | 'individual', organizationId: string) => {
  logEvent(analytics, "pdf_export", {
    export_type: type,
    organization_id: organizationId,
  });
};

/**
 * Logs a collaborator profile update event.
 * @param {string} userId - The ID of the user who was updated.
 */
export const logCollaboratorUpdated = (userId: string) => {
  logEvent(analytics, "collaborator_updated", {
    updated_user_id: userId,
  });
};
