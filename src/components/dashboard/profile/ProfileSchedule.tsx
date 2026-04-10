import { DAY_LABELS } from "@/lib/profileUtils";

interface ProfileScheduleProps {
  schedule: { day: string; period: string }[];
}

export function ProfileSchedule({ schedule }: ProfileScheduleProps) {
  const scheduleByDay = schedule.reduce<Record<string, string[]>>(
    (acc, { day, period }) => {
      if (!acc[day]) acc[day] = [];
      acc[day].push(period);
      return acc;
    },
    {},
  );

  return (
    <div className="bg-surface-container-low rounded-2xl p-5 mb-4">
      <p className="text-sm font-medium text-on-surface-variant mb-3">
        Grade de Horários
      </p>
      {schedule.length === 0 ? (
        <p className="text-sm text-on-surface-muted text-center py-4">
          Nenhum horário cadastrado
        </p>
      ) : (
        <div className="space-y-1">
          {Object.entries(scheduleByDay).map(([day, periods]) => (
            <div key={day} className="flex items-center justify-between py-2">
              <span className="text-sm text-on-surface">
                {DAY_LABELS[day] ?? day}
              </span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {periods.map((period) => (
                  <span
                    key={period}
                    className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {period}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
