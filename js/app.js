document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.getElementById("results");
  const searchInput = document.getElementById("search");
  const fieldSelect = document.getElementById("fieldSelect");

  resultsContainer.innerHTML = `<p class="text-center">Loading data...</p>`;

  // Firebase Setup using ES modules
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

  const firebaseConfig = {
    databaseURL: "https://exploreph1-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // Fetch listings from Firebase
  async function fetchListings() {
    try {
      const snapshot = await get(ref(db, "listings"));
      if (snapshot.exists()) {
        // Convert the Firebase object into an array
        window.listingsData = Object.values(snapshot.val());
        updateDisplay();
      } else {
        resultsContainer.innerHTML = `<p class="text-center">No data found.</p>`;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      resultsContainer.innerHTML = `<p class="text-center">Error loading data. Please try again later.</p>`;
    }
  }

  fetchListings();

  // Update display based on search input and selected filter field
  function updateDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterBy = fieldSelect.value; // "name", "location", or "categories"
    let filteredListings = window.listingsData || [];

    if (searchTerm) {
      filteredListings = filteredListings.filter(item => {
        let fieldValue = "";
        if (filterBy === "name") {
          fieldValue = item.post_title || "";
        } else if (filterBy === "location") {
          // Use the first listdom-location name if available, else fallback to meta address
          if (item.taxonomies && item.taxonomies["listdom-location"] && item.taxonomies["listdom-location"].length > 0) {
            fieldValue = item.taxonomies["listdom-location"][0].name || "";
          } else {
            fieldValue = item.meta?.lsd_address || "";
          }
        } else if (filterBy === "categories") {
          // Use the first listdom-category name if available
          if (item.taxonomies && item.taxonomies["listdom-category"] && item.taxonomies["listdom-category"].length > 0) {
            fieldValue = item.taxonomies["listdom-category"][0].name || "";
          }
        }
        return fieldValue.toLowerCase().includes(searchTerm);
      });
    }

    // If filtering by categories and no search term is entered, show a grouped view
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
    const categoryMap = {};
    listings.forEach(item => {
      let cat = "Uncategorized";
      if (item.taxonomies && item.taxonomies["listdom-category"] && item.taxonomies["listdom-category"].length > 0) {
        cat = item.taxonomies["listdom-category"][0].name || "Uncategorized";
      }
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, listings: [] };
      }
      categoryMap[cat].listings.push(item);
    });
    resultsContainer.innerHTML = "";
    Object.values(categoryMap).forEach(category => {
      const catCard = document.createElement("div");
      catCard.className = "bg-white p-4 rounded shadow cursor-pointer";
      catCard.innerHTML = `<h3 class="text-xl font-bold">${category.name}</h3>`;
      catCard.addEventListener("click", () => {
        displayListings(category.listings);
      });
      resultsContainer.appendChild(catCard);
    });
  }
});
