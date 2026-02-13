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
        "SELECT id, card_number, card_holder, card_expiry, balance, cvv, iban FROM cards WHERE user_id = ?",
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length === 0) return res.status(404).json({ error: "Карта не знайдена" });

            res.json(results[0]);
        }
    );
});

/** 
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
*/

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

/** Апи для для записи в транзакции история обновляеться*/

app.post("/api/transfer", authMiddleware, (req, res) => {
  const fromUserId = req.user.id;
  const { toCardNumber, amount, description } = req.body;

  const sum = Number(amount);

  if (!toCardNumber || !Number.isFinite(sum) || sum <= 0) {
    return res.status(400).json({ error: "Невірні дані" });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: "Помилка транзакції" });

    // Карта отправителя
    db.query(
      "SELECT * FROM cards WHERE user_id = ? FOR UPDATE",
      [fromUserId],
      (err, fromCards) => {
        if (err || !fromCards.length) {
          return db.rollback(() =>
            res.status(400).json({ error: "Карта відправника не знайдена" })
          );
        }

        const fromCard = fromCards[0];

        // Карта получателя
        db.query(
          "SELECT * FROM cards WHERE card_number = ? FOR UPDATE",
          [toCardNumber],
          (err, toCards) => {
            if (err || !toCards.length) {
              return db.rollback(() =>
                res.status(400).json({ error: "Карта отримувача не знайдена" })
              );
            }

            const toCard = toCards[0];

            // Запрет перевода на ту же карту
            if (fromCard.id === toCard.id) {
              return db.rollback(() =>
                res.status(400).json({ error: "Неможливо переказати на ту ж картку" })
              );
            }
            // Проверка баланса
            if (Number(fromCard.balance) < sum) {
              return db.rollback(() =>
                res.status(400).json({ error: "Недостатньо коштів" })
              );
            }
            // Cписание
            db.query(
              "UPDATE cards SET balance = balance - ? WHERE id = ?",
              [sum, fromCard.id],
              err => {
                if (err) return db.rollback(() =>
                  res.status(500).json({ error: "Помилка списання" })
                );
                // Начисление
                db.query(
                  "UPDATE cards SET balance = balance + ? WHERE id = ?",
                  [sum, toCard.id],
                  err => {
                    if (err) return db.rollback(() =>
                      res.status(500).json({ error: "Помилка зарахування" })
                    );
                    //  История отправителя
                    db.query(
                      `INSERT INTO transactions 
                      (user_id, card_id, type, amount, target_card_id, description)
                      VALUES (?, ?, 'expense', ?, ?, ?)`,
                      [fromUserId, fromCard.id, sum, toCard.id, description || "Переказ"],
                      err => {
                        if (err) return db.rollback(() =>
                          res.status(500).json({ error: "Помилка історії" })
                        );
                        // История получателя
                        db.query(
                          `INSERT INTO transactions 
                          (user_id, card_id, type, amount, target_card_id, description)
                          VALUES (?, ?, 'income', ?, ?, ?)`,
                          [toCard.user_id, toCard.id, sum, fromCard.id, description || "Отримання коштів"],
                          err => {
                            if (err) return db.rollback(() =>
                              res.status(500).json({ error: err.message })
                            );
                            //  Commit
                            db.commit(err => {
                              if (err) return db.rollback(() =>
                                res.status(500).json({ error: "Commit error" })
                              );

                              res.json({ message: "Переказ успішний" });
                            });
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

/**API чтоб отображать историю карточек */
app.get("/api/transfer/history", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.query(
    `
    SELECT c.card_number, MAX(t.created_at) AS last_transfer
    FROM transactions t
    JOIN cards c ON t.target_card_id = c.id
    WHERE t.user_id = ?
      AND t.type = 'expense'
      AND t.target_card_id IS NOT NULL
    GROUP BY c.card_number
    ORDER BY last_transfer DESC
    LIMIT 5
    `,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});


app.post("/api/mobile", authMiddleware, (req, res) => {
  const { phone, amount, comment } = req.body;
  const userId = req.user.id;
  const sum = Number(amount);

  if (!phone || !Number.isFinite(sum) || sum <= 0) {
    return res.status(400).json({ message: "Некоректні дані" });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ message: "Transaction error" });

    db.query(
      "SELECT id, balance FROM cards WHERE user_id = ? FOR UPDATE",
      [userId],
      (err, cards) => {
        if (err || !cards.length) {
          return db.rollback(() =>
            res.status(404).json({ message: "Картка не знайдена" })
          );
        }

        const card = cards[0];

        if (Number(card.balance) < sum) {
          return db.rollback(() =>
            res.status(400).json({ message: "Недостатньо коштів" })
          );
        }

        // списание
        db.query(
          "UPDATE cards SET balance = balance - ? WHERE id = ?",
          [sum, card.id],
          err => {
            if (err) return db.rollback(() =>
              res.status(500).json({ message: "Помилка списання" })
            );

            // создаём транзакцию
            db.query(
              `INSERT INTO transactions (user_id, card_id, type, amount, description)
               VALUES (?, ?, 'expense', ?, ?)`,
              [userId, card.id, sum, comment || `Поповнення телефону ${phone}`],
              (err, result) => {
                if (err) return db.rollback(() =>
                  res.status(500).json({ message: "Помилка історії" })
                );

                const transactionId = result.insertId;

                // mobile table
                db.query(
                  `INSERT INTO mobile (transaction_id, user_id, card_id, phone_number, amount)
                   VALUES (?, ?, ?, ?, ?)`,
                  [transactionId, userId, card.id, phone, sum],
                  err => {
                    if (err) return db.rollback(() =>
                      res.status(500).json({ message: "DB error" })
                    );

                    db.commit(err => {
                      if (err) return db.rollback(() =>
                        res.status(500).json({ message: "Commit error" })
                      );

                      res.json({ message: "Поповнення успішне" });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});


app.get("/api/mobile/history", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT phone_number
     FROM mobile
     WHERE user_id = ?
     GROUP BY phone_number
     ORDER BY MAX(created_at) DESC
     LIMIT 5`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows);
    }
  );
});

app.get("/api/transactions", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.query(
    `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.description,
      t.created_at,
      t.target_card_id,
      c2.card_number AS target_card_number,
      m.phone_number
    FROM transactions t
    JOIN cards c1 ON t.card_id = c1.id
    LEFT JOIN cards c2 ON t.target_card_id = c2.id
    LEFT JOIN mobile m ON m.transaction_id = t.id
    WHERE c1.user_id = ?
    ORDER BY t.created_at DESC
    `,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});



app.get("/api/transactions/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const txId = req.params.id;

  db.query(
    `
    SELECT 
      t.*,
      c2.card_number AS target_card_number,
      m.phone_number
    FROM transactions t
    JOIN cards c1 ON t.card_id = c1.id
    LEFT JOIN cards c2 ON t.target_card_id = c2.id
    LEFT JOIN mobile m ON m.transaction_id = t.id
    WHERE t.id = ? AND c1.user_id = ?
    LIMIT 1
    `,
    [txId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "Операція не знайдена" });

      const tx = rows[0];

      tx.operation_type = tx.phone_number ? "mobile" : "card";

      res.json(tx);
    }
  );
});


app.get("/api/cards/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const cardId = req.params.id;

  db.query(
    `SELECT id, card_number, card_holder, card_expiry, balance, cvv, iban
     FROM cards
     WHERE id = ? AND user_id = ?`,
    [cardId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "Картку не знайдено" });

      res.json(rows[0]);
    }
  );
});



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