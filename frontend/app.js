// app.js
document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const fetchButton = document.getElementById('fetch-data');
    const dataContainer = document.getElementById('data-container');

    // Check backend connection on page load
    checkBackendStatus();
    
    // Add event listener for the fetch button
    fetchButton.addEventListener('click', fetchDataFromBackend);

    // Function to check if the backend is reachable
    async function checkBackendStatus() {
        try {
            const response = await fetch('/api/health');
            
            if (response.ok) {
                statusElement.textContent = 'Connected to backend successfully!';
                statusElement.style.color = 'green';
            } else {
                statusElement.textContent = 'Backend is reachable but returning errors.';
                statusElement.style.color = 'orange';
            }
        } catch (error) {
            statusElement.textContent = 'Cannot connect to the backend. Is it running?';
            statusElement.style.color = 'red';
            console.error('Error connecting to backend:', error);
        }
    }

    // Function to fetch data from the backend API
    async function fetchDataFromBackend() {
        dataContainer.textContent = 'Loading...';
        
        try {
            const response = await fetch('/api/items');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Display the fetched data
            dataContainer.innerHTML = '';
            
            if (data && data.length > 0) {
                const list = document.createElement('ul');
                
                data.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${item.name}: ${item.description}`;
                    list.appendChild(listItem);
                });
                
                dataContainer.appendChild(list);
            } else {
                dataContainer.textContent = 'No items found.';
            }
        } catch (error) {
            dataContainer.textContent = 'Error fetching data from the API.';
            console.error('Error fetching data:', error);
        }
    }
});