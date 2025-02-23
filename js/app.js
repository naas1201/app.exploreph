document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.getElementById("results");
  const searchInput = document.getElementById("search");
  const fieldSelect = document.getElementById("fieldSelect");

  resultsContainer.innerHTML = "<p class='text-center'>Loading data...</p>";

  // Firebase Setup (using ES modules)
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

  const firebaseConfig = {
    databaseURL: "https://exploreph1-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  async function fetchListings() {
    try {
      const snapshot = await get(ref(db, "listings"));
      if (snapshot.exists()) {
        // Convert Firebase object to an array
        window.listingsData = Object.values(snapshot.val());
        updateDisplay();
      } else {
        resultsContainer.innerHTML = "<p class='text-center'>No data found.</p>";
      }
    } catch (error) {
      console.error("Error fetching Firebase data:", error);
      resultsContainer.innerHTML = "<p class='text-center'>Error loading data. Try again later.</p>";
    }
  }

  fetchListings();

  // Unified function to update the display based on search and filter
  function updateDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedField = fieldSelect.value; // "name", "location", or "categories"
    
    let filteredListings = window.listingsData || [];
    
    if (searchTerm) {
      filteredListings = filteredListings.filter(item => {
        let fieldValue = "";
        if (selectedField === "name") {
          fieldValue = item.post_title || "";
        } else if (selectedField === "location") {
          fieldValue = item.meta?.lsd_address || "";
        } else if (selectedField === "categories") {
          fieldValue = item.taxonomies?.["listdom-category"]?.[0]?.name || "";
        }
        return fieldValue.toLowerCase().includes(searchTerm);
      });
    }
    
    if (selectedField === "categories" && !searchTerm) {
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

  function displayListings(listings) {
    if (!listings || listings.length === 0) {
      resultsContainer.innerHTML = "<p class='text-center'>No results found.</p>";
      return;
    }
    resultsContainer.innerHTML = "";
    listings.forEach(item => {
      const card = document.createElement("div");
      card.className = "card bg-white p-4 rounded shadow";
      card.innerHTML = `
        <h3 class="text-xl font-bold mb-2">${item.post_title || "No Name"}</h3>
        <p class="mb-2"><strong>Description:</strong> ${item.post_content || "No description available"}</p>
        <p class="mb-2"><strong>Address:</strong> ${item.meta?.lsd_address || "No address provided"}</p>
        <p class="mb-2"><strong>Opening Hours:</strong> ${item.meta?.lsd_ava ? formatHours(item.meta.lsd_ava) : "No hours available"}</p>
        <p class="mb-2"><strong>Contact:</strong> ${item.meta?.lsd_phone || "No contact info"}</p>
      `;
      resultsContainer.appendChild(card);
    });
  }

  function displayCategories(listings) {
    // Group listings by category (using the first taxonomies category name)
    const categoriesMap = {};
    listings.forEach(listing => {
      let cat = listing.taxonomies?.["listdom-category"]?.[0]?.name || "Uncategorized";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { name: cat, listings: [] };
      }
      categoriesMap[cat].listings.push(listing);
    });
    resultsContainer.innerHTML = "";
    Object.values(categoriesMap).forEach(category => {
      const card = document.createElement("div");
      card.className = "card bg-white p-4 rounded shadow cursor-pointer";
      card.innerHTML = `<h3 class="text-xl font-bold">${category.name}</h3>`;
      card.addEventListener("click", () => displayListings(category.listings));
      resultsContainer.appendChild(card);
    });
  }

  function formatHours(ava) {
    return Object.values(ava).map(day => day.hours).join(", ");
  }
});
