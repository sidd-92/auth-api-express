const users = [
  {
    id: 1,
    username: "john",
    password: "password123admin",
    role: "admin",
  },
  {
    id: 2,
    username: "anna",
    password: "password123member",
    role: "member",
  },
  {
    id: 3,
    username: "jake",
    password: "password123admin",
    role: "member",
  },
  {
    id: 4,
    username: "frank",
    password: "password123member",
    role: "member",
  },
];

const books = [
  {
    author: "Chinua Achebe",
    country: "Nigeria",
    language: "English",
    pages: 209,
    title: "Things Fall Apart",
    year: 1958,
  },
  {
    author: "Hans Christian Andersen",
    country: "Denmark",
    language: "Danish",
    pages: 784,
    title: "Fairy tales",
    year: 1836,
  },
  {
    author: "Dante Alighieri",
    country: "Italy",
    language: "Italian",
    pages: 928,
    title: "The Divine Comedy",
    year: 1315,
  },
];

module.exports = { users, books };
