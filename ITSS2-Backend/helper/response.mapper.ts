export const mapJobToResponse = (job: any) => {
  if (!job) return job;
  return {
    ...job,
    _id: job.id,
    workingSchedule: job.schedules
      ? job.schedules.map((s: any) => ({
          day: s.day,
          period: s.period,
          time: s.time
        }))
      : []
  };
};

export const mapUserToResponse = (user: any) => {
  if (!user) return user;
  return {
    ...user,
    _id: user.id,
    workingSchedule: user.schedules
      ? user.schedules.map((s: any) => ({
          day: s.day,
          period: s.period,
          time: s.time
        }))
      : []
  };
};
