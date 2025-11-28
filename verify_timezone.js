const date = new Date("2025-11-27T11:55:24+00:00");
const timezone = "America/New_York";
console.log("UTC Time:", date.toISOString());
console.log("Target Timezone:", timezone);
console.log("Formatted:", date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
}));

const noTz = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
});
console.log("Formatted (No TZ):", noTz);
