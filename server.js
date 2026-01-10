require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const db = require("./config/db");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const ACCESS_SECRET = "ACCESS_SECRET_KEY_123";
const REFRESH_SECRET = "REFRESH_SECRET_KEY_456";

// ----------------------------------------------------
// Генерация токенов
// ----------------------------------------------------
function createAccessToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        ACCESS_SECRET,
        { expiresIn: "15m" }
    );
}

function createRefreshToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        REFRESH_SECRET,
        { expiresIn: "7d" }
    );
}

// Главная страница
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----------------------------------------------------
// Регистрация
// ----------------------------------------------------
app.post("/api/register", async (req, res) => {
    const { full_name, email, password, phone } = req.body;
    if (!full_name || !email || !password)
        return res.status(400).json({ error: "Заповніть всі поля!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (full_name, email, password, phone) VALUES (?, ?, ?, ?)",
        [full_name, email, hashedPassword, phone || null],
        (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY")
                    return res.status(400).json({ error: "Такий email вже існує!" });

                return res.status(500).json({ error: err });
            }

            res.json({ message: "Реєстрація успішна!" });
        }
    );
});

// ----------------------------------------------------
// Логин (сообщаем токены)
// ----------------------------------------------------
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0)
            return res.status(400).json({ error: "Користувача не знайдено" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Неправильний пароль!" });

        // Генерация токенов
        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        // Сохраняем refresh в базе
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        db.query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [user.id, refreshToken, expires]
        );

        // Записываем refresh в cookie (HttpOnly)
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // поставить true на проде (https)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: "Авторизація успішна!",
            accessToken,
            user: { id: user.id, full_name: user.full_name, email: user.email }
        });
    });
});

// ----------------------------------------------------
// Обновление Access Token
// ----------------------------------------------------
app.post("/api/refresh", (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) return res.status(401).json({ error: "Немає refresh токена" });

    // Проверяем, есть ли в БД
    db.query(
        "SELECT * FROM refresh_tokens WHERE token = ?",
        [token],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length === 0)
                return res.status(403).json({ error: "Недійсний refresh token" });

            jwt.verify(token, REFRESH_SECRET, (err, user) => {
                if (err) return res.status(403).json({ error: "Помилка токена" });

                const newAccess = createAccessToken(user);

                res.json({ accessToken: newAccess });
            });
        }
    );
});

// ----------------------------------------------------
// Логаут (удаление refresh token)
// ----------------------------------------------------
app.post("/api/logout", (req, res) => {
    const token = req.cookies.refreshToken;

    if (token) {
        db.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
});

// ----------------------------------------------------
// Все пользователи (тест API)
// ----------------------------------------------------
app.get("/api/users", (req, res) => {
    db.query("SELECT id, full_name, email, phone FROM users", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Получить карту и баланс пользователя
app.get("/api/card",authMiddleware, (req, res) => {
    const userId = req.user.id;

    db.query(
        "SELECT card_number, card_holder, card_expiry, balance FROM cards WHERE user_id = ?",
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length === 0) return res.status(404).json({ error: "Карта не знайдена" });

            res.json(results[0]);
        }
    );
});

app.get("/api/transactions",authMiddleware, (req, res) => {
    const userId = req.user.id;

    db.query(
        `SELECT type, amount, description, created_at
         FROM transactions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        }
    );
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));



/**Проверка access token на backend */

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}

/** Апи написал где я буду создавать карточку автоматически 
app.post("/api/register", async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: "Заповніть всі поля!" });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (full_name, email, password, phone) VALUES (?, ?, ?, ?)",
    [full_name, email, hashedPassword, phone || null],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ error: "Такий email вже існує!" });
        return res.status(500).json({ error: err });
      }

      const userId = result.insertId;

      // 🔐 генерация карты
      const cardNumber = "4000" + Math.floor(100000000000 + Math.random() * 900000000000);
      const expiry = "12/28";
      const cvvHash = bcrypt.hashSync(
        Math.floor(100 + Math.random() * 900).toString(),
        10
      );

      db.query(
        `INSERT INTO cards (user_id, card_number, card_holder, card_expiry, balance, cvv)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [userId, cardNumber, full_name, expiry, cvvHash],
        (err) => {
          if (err) return res.status(500).json({ error: err });

          res.json({ message: "Користувач і картка створені успішно!" });
        }
      );
    }
  );
});

 */