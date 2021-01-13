export const idMaker = length => {
    const chars = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
    let id = '';
    for (let i = 0; i < length; i++) id += chars[Math.floor(Math.random() * chars.length)]
    return id;
}

export const displayPrettyDate = date => {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options);
}

export const getSuccessMessage = () => {
    let messages = ['Great work!', 'Excellent!', 'Fabulous!', 'Wonderful job.', 'This is tremendous.', 'You did a remarkable job.', 'Magnificent!', 'How extraordinary.', 'Amazing!', 'Fantastic.', 'Nicely done.', 'This is terrific!', 'I love it!', 'Super work!', 'You did great!', 'You worked hard.', 'I am proud of this.', 'How incredible!', 'You did it!', 'Incredible!', 'Keep it up!', 'You have it perfectly.', 'Marvelous work.', 'You put in a lot of effort.', 'Awesome!', 'Marvelous job.', 'Right on!', 'Splendid!', 'Very impressive.', 'Stupendous!', 'That’s the way.', 'Good for you.', 'Nice going.', 'Way to go!', 'Well done!', 'You got this!', 'Really nice.', 'Bravo!', 'That’s great!', 'Hurray!', 'Beautiful work.', 'Outstanding!', 'Exceptional job.', 'Super-duper!', 'You hit the bulls eye.', 'Superb.', 'Brilliant!', 'Rock on!', 'This is top-notch.', 'Sensational!'];
    // 50 is messages.length
    return messages[Math.floor(Math.random() * 50)];
}

// export const getQuote = () => {
//     let xhttp = new XMLHttpRequest();
//     xhttp.onreadystatechange = function () {
//         if (this.readyState === 4 && this.status === 200) {
//             // Access the result here
//             alert(this.responseText);
//         }
//     };
//     xhttp.open("GET", "http://api.forismatic.com/api/1.0/", true);
//     xhttp.setRequestHeader("Content-type", "application/json");
//     xhttp.setRequestHeader("X-Theysaidso-Api-Secret", "YOUR API HERE");
//     xhttp.send();
// }