interface ProfileAcademicInfoProps {
  academicRows: { label: string; value: string }[];
}

export function ProfileAcademicInfo({
  academicRows,
}: ProfileAcademicInfoProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 mb-4">
      <p className="text-sm font-medium text-on-surface-variant mb-3">
        Dados Acadêmicos
      </p>
      {academicRows.map((row, i) => (
        <div key={row.label}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">{row.label}</span>
            <span className="text-sm font-medium text-on-surface">
              {row.value}
            </span>
          </div>
          {i < academicRows.length - 1 && (
            <hr className="border-outline-variant/30 mt-4" />
          )}
        </div>
      ))}
    </div>
  );
}
