class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  getUserDetails() {
    return `ID: ${this.id}, Name: ${this.name}, Email: ${this.email}`;
  }
}