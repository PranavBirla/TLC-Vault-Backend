const IST_TIMEZONE = "Asia/Kolkata";

const getISTDate = (value = new Date()) => {
  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      "Invalid date supplied to getISTDate()"
    );
  }

  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: IST_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    throw new Error(
      "Unable to determine IST calendar date"
    );
  }

  return `${year}-${month}-${day}`;
};

const getPreviousISTDate = (activityDate) => {
  if (
    typeof activityDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(activityDate)
  ) {
    throw new TypeError(
      "Invalid IST date supplied to getPreviousISTDate()"
    );
  }

  const date = new Date(`${activityDate}T00:00:00Z`);

  date.setUTCDate(
    date.getUTCDate() - 1
  );

  return date.toISOString().slice(0, 10);
};

module.exports = {
  IST_TIMEZONE,
  getISTDate,
  getPreviousISTDate,
};