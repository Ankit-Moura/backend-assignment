const calculateDelay = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);

  // reminder = 1 hour before due_date
  const reminderTime = new Date(due.getTime() - 60 * 60 * 1000);

  const delay = reminderTime.getTime() - now.getTime();

  // if time already passed → don't schedule
  return delay > 0 ? delay : 0;
};

console.log(calculateDelay("2026-04-28T03:55:00+05:30"));

module.exports = calculateDelay;