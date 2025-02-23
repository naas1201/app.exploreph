document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.getElementById("results");
  const searchInput = document.getElementById("search");
  const fieldSelect = document.getElementById("fieldSelect");

  resultsContainer.innerHTML = "<p>Loading data...</p>";

  // Firebase Setup
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

  const firebaseConfig = {
    databaseURL: "https://exploreph1-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // Fetch Data from Firebase
  async function fetchListings() {
    try {
      const snapshot = await get(ref(db, "listings")); // Fetch from Firebase
      if (snapshot.exists()) {
        window.listingsData = Object.values(snapshot.val()); // Convert object to array
        updateDisplay(); // Show initial listings
      } else {
        resultsContainer.innerHTML = "<p>No data found.</p>";
      }
    } catch (error) {
      console.error("Error loading Firebase data:", error);
      resultsContainer.innerHTML = "<p>Error loading data. Try again later.</p>";
    }
  }

  fetchListings(); // Load Firebase data

  // Search & Filter Functionality
  function updateDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedField = fieldSelect.value;

    let filteredListings = window.listingsData || []; // Default to full dataset if undefined

    // Perform filtering
    if (searchTerm) {
      filteredListings = filteredListings.filter((item) => {
        const fieldValue = item[selectedField] ? String(item[selectedField]).toLowerCase() : "";
        return fieldValue.includes(searchTerm);
      });
    }

    if (selectedField === "categories") {
      displayCategories(filteredListings);
    } else {
      displayListings(filteredListings);
    }
  }

  // Listen for search & filter changes
  searchInput.addEventListener("input", updateDisplay);
  fieldSelect.addEventListener("change", () => {
    searchInput.value = ""; // Clear search when switching fields
    updateDisplay();
  });

  // Display Listings
  function displayListings(listings) {
    resultsContainer.innerHTML = listings.length === 0 ? "<p>No results found.</p>" : "";
    listings.forEach(item => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <h3>${item.post_title || "No Name"}</h3>
        <p><strong>Description:</strong> ${item.post_content || "No description available"}</p>
        <p><strong>Address:</strong> ${item.meta?.lsd_address || "No address provided"}</p>
        <p><strong>Opening Hours:</strong> ${item.meta?.lsd_ava ? formatHours(item.meta.lsd_ava) : "No hours available"}</p>
        <p><strong>Contact:</strong> ${item.meta?.lsd_phone || "No contact info"}</p>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Display Categories
  function displayCategories(filteredListings) {
    const categoriesMap = {};
    (filteredListings || window.listingsData).forEach(listing => {
      let cat = listing.taxonomies?.["listdom-category"]?.[0]?.name || "Uncategorized";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { name: cat, listings: [] };
      }
      categoriesMap[cat].listings.push(listing);
    });

    resultsContainer.innerHTML = "";
    Object.values(categoriesMap).forEach(category => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `<h3>${category.name}</h3>`;
      card.addEventListener("click", () => displayListings(category.listings));
      resultsContainer.appendChild(card);
    });
  }

  // Format Opening Hours
  function formatHours(ava) {
    return Object.values(ava).map(day => day.hours).join(", ");
  }

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(error => console.log("Service Worker Registration Failed", error));
    });
  }
});
