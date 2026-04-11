import ActionCard from "@/components/dashboard/ActionCard";
import LicenseActionCard from "@/components/dashboard/LicenseActionCard";
import {
  DASHBOARD_ACTIONS,
  DOCUMENTS_ACTION,
} from "@/constants/dashboard-actions";

interface DashboardActionsProps {
  licenseLoading: boolean;
  hasLicense: boolean;
  isUnderReview: boolean;
  isRejected: boolean;
  isWaitlisted: boolean;
  filaPosition: number | null;
  hasOpenEnrollmentPeriod: boolean;
  rejectionReason: string | null;
  shouldShowDocumentsCard: boolean;
}

export function DashboardActions({
  licenseLoading,
  hasLicense,
  isUnderReview,
  isRejected,
  isWaitlisted,
  filaPosition,
  hasOpenEnrollmentPeriod,
  rejectionReason,
  shouldShowDocumentsCard,
}: DashboardActionsProps) {
  return (
    <nav className="flex flex-col gap-4 flex-1">
      <LicenseActionCard
        loading={licenseLoading}
        hasLicense={hasLicense}
        isUnderReview={isUnderReview}
        isRejected={isRejected}
        isWaitlisted={isWaitlisted}
        filaPosition={filaPosition}
        hasOpenEnrollmentPeriod={hasOpenEnrollmentPeriod}
        rejectionReason={rejectionReason}
      />
      {shouldShowDocumentsCard && <ActionCard action={DOCUMENTS_ACTION} />}
      {DASHBOARD_ACTIONS.filter(
        (action) => action.href !== DOCUMENTS_ACTION.href,
      ).map((action) => (
        <ActionCard
          key={action.href}
          action={action}
          disabled={
            licenseLoading || (action.requiresLicense === true && !hasLicense)
          }
        />
      ))}
    </nav>
  );
}
