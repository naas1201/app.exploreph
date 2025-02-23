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
        if (fieldSelect.value === "categories") {
          displayCategories();
        } else {
          displayListings(window.listingsData);
        }
      } else {
        resultsContainer.innerHTML = "<p>No data found.</p>";
      }
    } catch (error) {
      console.error("Error loading Firebase data:", error);
      resultsContainer.innerHTML = "<p>Error loading data. Try again later.</p>";
    }
  }

  fetchListings(); // Load Firebase data

  // Listen for changes in the dropdown
  fieldSelect.addEventListener("change", () => {
    searchInput.value = "";
    if (fieldSelect.value === "categories") {
      displayCategories();
    } else {
      displayListings(window.listingsData);
    }
  });

  // Listen for search input changes for non-category filtering
  searchInput.addEventListener("input", () => {
    if (fieldSelect.value !== "categories") {
      const searchTerm = searchInput.value.toLowerCase();
      const filteredListings = window.listingsData.filter(item => {
        let fieldValue = item[fieldSelect.value] || "";
        return fieldValue.toLowerCase().includes(searchTerm);
      });
      displayListings(filteredListings);
    }
  });

  // Function to display listings as cards
  function displayListings(listings) {
    if (!listings || listings.length === 0) {
      resultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }
    resultsContainer.innerHTML = "";
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

  // Function to format opening hours
  function formatHours(ava) {
    return Object.values(ava)
      .map(day => day.hours)
      .join(", ");
  }

  // Function to group listings by category and display category cards
  function displayCategories() {
    const categoriesMap = {};
    window.listingsData.forEach(listing => {
      let cat = listing.taxonomies?.["listdom-category"]?.[0]?.name || "Uncategorized";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { name: cat, description: "", listings: [] };
      }
      categoriesMap[cat].listings.push(listing);
    });

    const categoriesArray = Object.values(categoriesMap);
    resultsContainer.innerHTML = "";
    categoriesArray.forEach(category => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `<h3>${category.name}</h3>`;
      card.addEventListener("click", () => displayListingsForCategory(category));
      resultsContainer.appendChild(card);
    });
  }

  // Function to display listings for a specific category
  function displayListingsForCategory(category) {
    resultsContainer.innerHTML = `<button id="backButton">Back to Categories</button>`;
    document.getElementById("backButton").addEventListener("click", displayCategories);
    category.listings.forEach(listing => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <h4>${listing.post_title || "No Name"}</h4>
        <p><strong>Description:</strong> ${listing.post_content || "No description available"}</p>
        <p><strong>Address:</strong> ${listing.meta?.lsd_address || "No address provided"}</p>
        <p><strong>Opening Hours:</strong> ${listing.meta?.lsd_ava ? formatHours(listing.meta.lsd_ava) : "No hours available"}</p>
        <p><strong>Contact:</strong> ${listing.meta?.lsd_phone || "No contact info"}</p>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Register Service Worker for PWA support
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(error => console.log("Service Worker Registration Failed", error));
    });
  }
});
