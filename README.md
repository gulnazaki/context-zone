# context-zone
Context Zone is a web app that creates personalized playlists, that aspire to convey the feeling you get from certain music, but at the same time contain songs you will find more familiar to your music taste.<br><br> You can find it deployed on https://context-zone.herokuapp.com.

## About
By using keywords, you can search for playlists, and include up to 10 that suit your context of choice. Using the Spotify API, this app gets the audio features of all the playlist songs and computes the **mean** and **standard deviation** for each feature. Afterwards, you can choose how far from your comfort zone you want to roam. There is an option for a shallow or deep profiling, for the first it gets your top 50 artists, and for the latter it keeps a number of their related artists, that depends on your top artists' ranking. These artists are used as seeds (alone or randomly combined) to get track recommendations from the Spotify API, along with target mean values for the above audio features. The recommended tracks are further sorted based on their distance **&sum;<sub>i</sub>(x<sub>i</sub> - μ<sub>i</sub>)/σ<sub>i</sub>** from the selected audio feature distribution, and the top 100 songs are used to create a selection that is saved as a private Spotify playlist.

## Usage
For example, you can search "sleep" or "relax" and generate a playlist that includes some calm songs you may like. Or "running", and go for a run. <br> Also, you could add some punk or rap playlists and find some tracks that will introduce you smoothly to these genres.

## Next steps
It is obvious that by selecting playlists that try to match their intended descriptions and not analyzing the given context directly, this app introduces a bias to the feature distribution. For example a lot of workout songs are pop. A more direct mapping of text to audio features would help with this, as well as other ways to reduce noise in the selection of the songs to be analyzed. Also, a more finegrained song selection could have some fun results, such as finding music that belong to the borders of different genres.
