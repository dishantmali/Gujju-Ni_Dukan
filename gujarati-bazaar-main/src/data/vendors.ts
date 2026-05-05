import { Category, Vendor } from "./types";

export const categories: Category[] = [
  { slug: "groceries", name: "Groceries", emoji: "🌾" },
  { slug: "snacks", name: "Snacks", emoji: "🥨" },
  { slug: "pickles", name: "Pickles", emoji: "🥭" },
  { slug: "spices", name: "Spices", emoji: "🌶️" },
  { slug: "sweets", name: "Sweets", emoji: "🍬" },
  { slug: "dry-fruits", name: "Dry Fruits", emoji: "🥜" },
  { slug: "handicrafts", name: "Handicrafts", emoji: "🪔" },
  { slug: "clothing", name: "Clothing", emoji: "👘" },
  { slug: "pooja-items", name: "Pooja Items", emoji: "🕉️" },
  { slug: "home-decor", name: "Home Decor", emoji: "🏺" },
];

export const vendors: Vendor[] = [
  { id: "v1", name: "Raju Farsan Wala", tagline: "Crispy snacks since 1962", rating: 4.7, joined: "2019", city: "Ahmedabad", initials: "RF" },
  { id: "v2", name: "Amba Achar House", tagline: "Sun-dried Gujarati pickles", rating: 4.8, joined: "2020", city: "Vadodara", initials: "AA" },
  { id: "v3", name: "Surat Silk Store", tagline: "Handwoven heritage", rating: 4.6, joined: "2018", city: "Surat", initials: "SS" },
  { id: "v4", name: "Kutch Handicrafts", tagline: "Mirror-work artistry", rating: 4.9, joined: "2017", city: "Bhuj", initials: "KH" },
  { id: "v5", name: "Manek Chowk Sweets", tagline: "Mithai from old city", rating: 4.8, joined: "2016", city: "Ahmedabad", initials: "MC" },
  { id: "v6", name: "Saurashtra Spice Mill", tagline: "Stone-ground masalas", rating: 4.7, joined: "2019", city: "Rajkot", initials: "SP" },
  { id: "v7", name: "Bhavnagar Dry Fruits", tagline: "Premium kaju & badam", rating: 4.6, joined: "2021", city: "Bhavnagar", initials: "BD" },
  { id: "v8", name: "Patola Heritage", tagline: "Patan double-ikat sarees", rating: 4.9, joined: "2015", city: "Patan", initials: "PH" },
];
