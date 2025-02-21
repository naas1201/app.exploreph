document.addEventListener("DOMContentLoaded", () => {
    const resultsContainer = document.getElementById("results");
    const searchInput = document.getElementById("search");
    
    resultsContainer.innerHTML = "<p>Loading data...</p>"; // Show loading message

    fetch("/data/listings.json")
        .then(response => response.json())
        .then(data => {
            window.listingsData = data;
            displayListings(data); // Display data on load
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
            resultsContainer.innerHTML = "<p>Error loading data. Try again later.</p>";
        });

    function displayListings(listings) {
        if (!listings || listings.length === 0) {
            resultsContainer.innerHTML = "<p>No results found.</p>";
            return;
        }
        resultsContainer.innerHTML = ""; // Clear old content

        listings.forEach(item => {
            const listingElement = document.createElement("div");
            listingElement.classList.add("listing");

            listingElement.innerHTML = `
                <h3>${item.name || "No Name"}</h3>
                <p><strong>Description:</strong> ${item.description || "No description available"}</p>
                <p><strong>Address:</strong> ${item.address || "No address provided"}</p>
                <p><strong>Opening Hours:</strong> ${item.opening_hours || "No hours available"}</p>
                <p><strong>Contact:</strong> ${item.contact || "No contact info"}</p>
                <hr>
            `;

            resultsContainer.appendChild(listingElement);
        });
    }

    // Search Function
    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredListings = window.listingsData.filter(item =>
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            (item.address && item.address.toLowerCase().includes(searchTerm))
        );
        displayListings(filteredListings);
    });

    // Register Service Worker for PWA support
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js")
                .then(() => console.log("Service Worker Registered"))
                .catch(error => console.log("Service Worker Registration Failed", error));
        });
    }
});
