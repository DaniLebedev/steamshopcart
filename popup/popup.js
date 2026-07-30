let games = []

let btnget = document.querySelector(".btn-get");
btnget.addEventListener("click", () => {
  SetGames();
});

function SetGames() {
  for (let i = 0; i < 5; i++) {
    games.id[i] = i;
    games.id[i].game = `$game {i}`;
  }
  array.forEach(element => {
      console.log(games[element]);
    });

}


