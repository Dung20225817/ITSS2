import { Prisma } from "@prisma/client";

export const CITY_OPTIONS = ["Hà Nội", "Hồ Chí Minh"];

const CITY_ALIASES = [
  {
    label: "Hà Nội",
    aliases: ["Hà Nội", "Ha Noi", "Hanoi"],
  },
  {
    label: "Hồ Chí Minh",
    aliases: [
      "Hồ Chí Minh",
      "Ho Chi Minh",
      "Ho Chi Minh City",
      "TP Ho Chi Minh",
      "TP. Ho Chi Minh",
      "Thanh pho Ho Chi Minh",
      "HCM",
      "TP HCM",
      "TP. HCM",
      "Sài Gòn",
      "Sai Gon",
    ],
  },
];

const normalizeCity = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const getCityAliases = (value: string): string[] => {
  const normalizedValue = normalizeCity(value);
  const city = CITY_ALIASES.find(({ label, aliases }) => {
    const normalizedLabel = normalizeCity(label);
    const normalizedAliases = aliases.map(normalizeCity);
    return (
      normalizedValue === normalizedLabel ||
      normalizedAliases.includes(normalizedValue)
    );
  });

  return city?.aliases || [value];
};

export const buildCityWhere = (value: string): Prisma.JobWhereInput => {
  const aliases = getCityAliases(value);

  return {
    OR: aliases.flatMap((alias) => [
      { address: { contains: alias, mode: "insensitive" as const } },
      {
        company: {
          is: {
            location: { contains: alias, mode: "insensitive" as const },
          },
        },
      },
    ]),
  };
};
