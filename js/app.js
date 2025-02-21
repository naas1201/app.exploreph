document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("results").innerHTML = "<p>Loading data...</p>"; // Show loading message
    fetch("/data/listings.json")
        .then(response => response.json())
        .then(data => {
            window.listingsData = data;
            document.getElementById("results").innerHTML = "<p>Data loaded. Search above.</p>";
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
            document.getElementById("results").innerHTML = "<p>Error loading data. Try again later.</p>";
        });
});
