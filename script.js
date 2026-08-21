const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");

let highestMarks = 0;
let topperName = "";

form.addEventListener("submit", function(e) {

    e.preventDefault();

    let username = document.getElementById("username").value;
    let physics = Number(document.getElementById("physics").value);
    let chemistry = Number(document.getElementById("chemistry").value);
    let english = Number(document.getElementById("english").value);

    // Calculate Total
    let total = physics + chemistry + english;

    // Show total in input
    document.getElementById("total").value = total;

    // Add row to table
    let row = table.insertRow();

    row.insertCell(0).innerHTML = username;
    row.insertCell(1).innerHTML = physics;
    row.insertCell(2).innerHTML = chemistry;
    row.insertCell(3).innerHTML = english;
    row.insertCell(4).innerHTML = total;

    // Find Topper
    if (total > highestMarks) {
        highestMarks = total;
        topperName = username;
    }

    // Display topper
    document.getElementById("topper").innerHTML =
        "Topper: " + topperName + " (" + highestMarks + " Marks)";

    // Clear form
    form.reset();
    document.getElementById("total").value = "";
});