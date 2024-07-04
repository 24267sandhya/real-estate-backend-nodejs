// server.js
const express = require("express");
const pool = require("./db");
const port = 1337;

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Node server running",
  });
});

// Add new property
app.post("/add_new_property", async (req, res) => {
  const { property_name, locality, owner_name } = req.body;
  try {
    const localityResult = await pool.query(
      "SELECT id FROM localities WHERE name = $1",
      [locality]
    );
    let localityId;

    if (localityResult.rows.length === 0) {
      const newLocality = await pool.query(
        "INSERT INTO localities (name) VALUES ($1) RETURNING id",
        [locality]
      );
      localityId = newLocality.rows[0].id;
    } else {
      localityId = localityResult.rows[0].id;
    }

    const newProperty = await pool.query(
      "INSERT INTO properties (property_name, owner_name, locality_id) VALUES ($1, $2, $3) RETURNING id",
      [property_name, owner_name, localityId]
    );

    res
      .status(201)
      .json({ message: "Property added", propertyId: newProperty.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch all properties
app.get("/fetch_all_properties", async (req, res) => {
  const { locality_name } = req.query;
  try {
    const locality = await pool.query(
      "SELECT id FROM localities WHERE name = $1",
      [locality_name]
    );
    if (locality.rows.length === 0) {
      return res.status(404).json({ error: "Locality not found" });
    }

    const properties = await pool.query(
      "SELECT id, property_name, owner_name FROM properties WHERE locality_id = $1",
      [locality.rows[0].id]
    );

    res.status(200).json(properties.rows);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update property details
app.put("/update_property_details", async (req, res) => {
  const { property_id, locality_id, owner_name } = req.body;
  try {
    const property = await pool.query(
      "SELECT * FROM properties WHERE id = $1",
      [property_id]
    );
    if (property.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    await pool.query(
      "UPDATE properties SET locality_id = $1, owner_name = $2 WHERE id = $3",
      [locality_id, owner_name, property_id]
    );

    res.status(200).json({
      message: "Property updated",
      property: { property_id, locality_id, owner_name },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete property record
app.delete("/delete_property_record", async (req, res) => {
  const { property_id } = req.body;
  try {
    const property = await pool.query(
      "SELECT * FROM properties WHERE id = $1",
      [property_id]
    );
    if (property.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    await pool.query("DELETE FROM properties WHERE id = $1", [property_id]);
    res.status(200).json({ message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => console.log(`Server has started on port: ${port}`));
