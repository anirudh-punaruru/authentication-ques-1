const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let db = null;
const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: '${e.message}'`);
    process.exit(1);
  }
};
initDbAndServer();

app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username= '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserQuery = `
        insert into 
        user (username, name, password, gender, location) 
        values ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;

    if (password.length >= 5) {
      await db.run(createUserQuery);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `
    select *
    from user
    where username= '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const correctPassword = await bcrypt.compare(password, dbUser.password);
    if (correctPassword === true) {
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const selectUserQuery = `
    select *
    from use
    where username= '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  const correctPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (correctPassword === true) {
    if (newPassword.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
                update user
                set password= '${hashedPassword}'
                where username= '${username}';`;
      await db.run(updatePasswordQuery);
      res.send("Password updated");
    }
  } else {
    res.status(400);
    res.send("Invalid current password");
  }
});

module.exports = app;
