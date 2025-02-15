
socket.on('recieveHelmetNames', (names) => {

    const dropdownContent = document.querySelector('.helmetDropdown-content');

    console.log("Received helmet names:", names);

    const helmetName = document.getElementById('helmetName'); 
    const helmetImage = document.getElementById('helmetImage'); 

    const options = names;//.map((item) => item['name']);
    // console.log(options);

    options.forEach((option, index) => {
        const button = document.createElement('button-helmet');

        button.textContent = option;
        button.onclick = () => {
            console.log("Requesting helmet:", option);
            socket.emit('requestHelmetData', option);

            helmetName.textContent = option;
            helmetImage.src = `images/${option}.png`;
        }

        dropdownContent.appendChild(button);
    });
});

<div class="helmetDropdown">
<button class="dropbtn">Helmet</button>
<div class="helmetDropdown-content">
    <input type="text" class="search-input" placeholder="Search..." onkeyup="filterOptions(this, '.helmetDropdown-content', 'button-helmet')">
</div>
<h1 id="helmetName"></h1>
<img id="helmetImage" src="helmet.png"> 
</div>