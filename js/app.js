// Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  databaseURL: "https://exploreph1-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  const resultsContainer = document.getElementById("results");
  const searchInput = document.getElementById("search");
  const fieldSelect = document.getElementById("fieldSelect");

  resultsContainer.innerHTML = `<p class="text-center">Loading data...</p>`;

  // Fetch listings from Firebase
  async function fetchListings() {
    try {
      const snapshot = await get(ref(db, "listings"));
      if (snapshot.exists()) {
        window.listingsData = Object.values(snapshot.val());
        console.log("✅ Firebase Data Loaded:", window.listingsData); // Debugging log
        updateDisplay();
      } else {
        console.warn("⚠️ No listings found in Firebase.");
        resultsContainer.innerHTML = "<p class='text-center'>No data found.</p>";
      }
    } catch (error) {
      console.error("❌ Firebase Fetch Error:", error);
      resultsContainer.innerHTML = "<p class='text-center'>Error loading data. Please try again later.</p>";
    }
  }

  await fetchListings();

  // Update display based on search input and selected filter field
  function updateDisplay() {
    if (!window.listingsData) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const filterBy = fieldSelect.value; // "name", "location", or "categories"
    let filteredListings = [...window.listingsData];

    if (searchTerm) {
      filteredListings = filteredListings.filter(item => {
        let fieldValue = "";
        if (filterBy === "name") {
          fieldValue = item.post_title || "";
        } else if (filterBy === "location") {
          fieldValue = item.taxonomies?.["listdom-location"]?.[0]?.name || item.meta?.lsd_address || "";
        } else if (filterBy === "categories") {
          fieldValue = item.taxonomies?.["listdom-category"]?.[0]?.name || "";
        }
        return fieldValue.toLowerCase().includes(searchTerm);
      });
    }

    console.log("🔍 Filtered Listings:", filteredListings); // Debugging log

    if (filterBy === "categories" && !searchTerm) {
      displayCategories(window.listingsData);
    } else {
      displayListings(filteredListings);
    }
  }

  searchInput.addEventListener("input", updateDisplay);
  fieldSelect.addEventListener("change", () => {
    searchInput.value = "";
    updateDisplay();
  });

  // Display listings as individual cards
  function displayListings(listings) {
    if (!listings || listings.length === 0) {
      resultsContainer.innerHTML = `<p class="text-center">No results found.</p>`;
      return;
    }
    resultsContainer.innerHTML = "";
    listings.forEach(item => {
      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded shadow";
      card.innerHTML = `
        <h3 class="text-xl font-bold mb-2">${item.post_title || "No Name"}</h3>
        <p class="mb-2"><strong>Description:</strong> ${item.post_content || "No description available"}</p>
        <p class="mb-2"><strong>Address:</strong> ${item.meta?.lsd_address || "No address provided"}</p>
        <p class="mb-2"><strong>Contact:</strong> ${item.meta?.lsd_phone || "No contact info"}</p>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Display grouped categories as cards
  function displayCategories(listings) {
    if (!listings || listings.length === 0) {
      resultsContainer.innerHTML = `<p class="text-center">No categories found.</p>`;
      return;
    }

    const categoryMap = {};
    listings.forEach(item => {
      let cat = item.taxonomies?.["listdom-category"]?.[0]?.name || "Uncategorized";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, listings: [] };
      }
      categoryMap[cat].listings.push(item);
    });

    resultsContainer.innerHTML = "";
    Object.values(categoryMap).forEach(category => {
      const catCard = document.createElement("div");
      catCard.className = "bg-white p-4 rounded shadow cursor-pointer hover:bg-gray-200 transition";
      catCard.innerHTML = `<h3 class="text-xl font-bold">${category.name}</h3>`;
      catCard.addEventListener("click", () => {
        displayListings(category.listings);
      });
      resultsContainer.appendChild(catCard);
    });
  }
});
