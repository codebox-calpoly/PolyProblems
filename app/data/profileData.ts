export type Report = {
  id: string;
  title: string;
};

export const profileUser = {
  username: "@johndoe",
  memberSince: "December 2025",
  reportsCount: 2,
  commentsCount: 4,
};

export const profileReports: Report[] = [
  { id: "1", title: "Broken Laundry Machine in Cerro Vista 203" },
  { id: "2", title: "Water Pressure Low in Tower 5 Showers" },
];
