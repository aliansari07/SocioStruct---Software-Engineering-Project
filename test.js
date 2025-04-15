const bcrypt = require('bcryptjs');

// const storedHashedPassword = "$2a$10$mB7.HJJ/3kzh5km1uu..Su1evmXC9V75rs.E27M1bRb..."; // From database
const inputPassword = "Fast1234"; // User input

const hashedPassword = await bcrypt.hash(inputPassword, 10);
bcrypt.compare(inputPassword, hashedPassword, (err, result) => {
    if (err) {
        console.error("Bcrypt error:", err);
    } else if (result) {
        console.log("Passwords match!");
    } else {
        console.log("Passwords do not match!");
    }
});
