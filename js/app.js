document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.getElementById("results");
  const searchInput = document.getElementById("search");
  const fieldSelect = document.getElementById("fieldSelect");

  resultsContainer.innerHTML = "<p>Loading data...</p>";

  // Fetch data from the JSON file using a relative path
  fetch("data/listings.json")
    .then(response => response.json())
    .then(data => {
      window.listingsData = data;  // Store globally for filtering
      // Initially, display data based on the selected field:
      if (fieldSelect.value === "categories") {
        displayCategories();
      } else {
        displayListings(data);
      }
    })
    .catch(error => {
      console.error("Error loading JSON:", error);
      resultsContainer.innerHTML = "<p>Error loading data. Try again later.</p>";
    });

  // Listen for changes in the dropdown
  fieldSelect.addEventListener("change", () => {
    // Clear search input when switching modes
    searchInput.value = "";
    if (fieldSelect.value === "categories") {
      displayCategories();
    } else {
      // For name or description filtering, display all listings first
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
        <h3>${item.name || "No Name"}</h3>
        <p><strong>Description:</strong> ${item.description || "No description available"}</p>
        <p><strong>Address:</strong> ${item.address || "No address provided"}</p>
        <p><strong>Opening Hours:</strong> ${item.opening_hours || "No hours available"}</p>
        <p><strong>Contact:</strong> ${item.contact || "No contact info"}</p>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Function to group listings by category and display category cards
  function displayCategories() {
    // Group listings by their "categories" property.
    const categoriesMap = {};
    window.listingsData.forEach(listing => {
      // Assume listing.categories is a string; if missing, label as "Uncategorized"
      let cat = listing.categories ? listing.categories.trim() : "Uncategorized";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name: cat,
          // Optionally, if you have a description for the category, use it;
          // otherwise, this will be an empty string.
          description: listing.categoryDescription || "",
          listings: []
        };
      }
      categoriesMap[cat].listings.push(listing);
    });
    const categoriesArray = Object.values(categoriesMap);
    resultsContainer.innerHTML = "";
    categoriesArray.forEach(category => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <h3>${category.name}</h3>
        <p>${category.description || "No description available"}</p>
      `;
      // When a category card is clicked, show all listings under that category
      card.addEventListener("click", () => {
        displayListingsForCategory(category);
      });
      resultsContainer.appendChild(card);
    });
  }

  // Function to display listings for a specific category
  function displayListingsForCategory(category) {
    // Create a back button to return to the categories view
    resultsContainer.innerHTML = `<button id="backButton">Back to Categories</button>`;
    document.getElementById("backButton").addEventListener("click", () => {
      displayCategories();
    });
    // Append each listing as a card under this category
    category.listings.forEach(listing => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <h4>${listing.name || "No Name"}</h4>
        <p><strong>Description:</strong> ${listing.description || "No description available"}</p>
        <p><strong>Address:</strong> ${listing.address || "No address provided"}</p>
        <p><strong>Opening Hours:</strong> ${listing.opening_hours || "No hours available"}</p>
        <p><strong>Contact:</strong> ${listing.contact || "No contact info"}</p>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Register Service Worker for PWA support (if needed)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(error => console.log("Service Worker Registration Failed", error));
    });
  }
});
