import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getSession, useSession, signIn, signOut } from "next-auth/react"
import dynamic from "next/dynamic"
const TinderCard = dynamic(() => import('react-tinder-card'), {
  ssr: false
});

<<<<<<< Updated upstream
export default function Home({connected, tracks}) {
  const [numberOfTracks, setNumberOfTracks] = useState(0);
  const [numberOfPages, setNumberOfPages] = useState(0);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [allTracks, setAllTracks] = useState(tracks);
  const { data: session } = useSession()
=======
export default function Home({connected, total, tracks}) {
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [allTracks, setAllTracks] = useState((tracks) ? tracks : []);
    const [isPlaying, setIsPlaying] = useState(false);
>>>>>>> Stashed changes

  const [currentIndex, setCurrentIndex] = useState((allTracks && allTracks.items) ? allTracks.items.length - 1 : 49)
  const [lastDirection, setLastDirection] = useState()
  // used for outOfFrame closure
  const currentIndexRef = useRef(currentIndex)

  const swiped = (direction, nameToDelete, index) => {
    setLastDirection(direction)
    updateCurrentIndex(index - 1)

    const track = allTracks.items[index - 1];

    if(direction == "right"){
      let pl_tracks = playlistTracks;
      pl_tracks = [...pl_tracks, track.track.uri ];
      setPlaylistTracks(pl_tracks)
    }

    document.getElementById('preview-music').pause();
    if(track && track.track && track.track.preview_url){
      document.getElementById('preview-music').setAttribute('src', track.track.preview_url);
    }
    document.getElementById('preview-music').play();
  }

  const childRefs = useMemo(
    () =>
    (allTracks && allTracks.items) ? 
      Array(allTracks.items.length)
        .fill(0)
        .map((i) => React.createRef()) : 0,
    []
  )
  const updateCurrentIndex = (val) => {
    setCurrentIndex(val)
    currentIndexRef.current = val
  }

  const playPreview = (previewUrl) => {
    // console.log(`You play preview from ${previewUrl}.`);

    document.getElementById('preview-music').pause();
    document.getElementById('preview-music').setAttribute('src', previewUrl);
    document.getElementById('preview-music').play();
  }

  const loadMore = async () => {
    async function fetchWebApi(endpoint, method, body) {
      const res = await fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        method,
        body:JSON.stringify(body)
      });
      return await res.json();
    }
    
    async function getSavedTracks(){
      return (await fetchWebApi(
        `v1/me/tracks?market=FR&limit=50&offset=${50 * currentPage}`, 'GET'
      ));
    }
    
    const savedTracks = await getSavedTracks();
    let new_tracks = allTracks;
    new_tracks.items = [...new_tracks.items, ...savedTracks.items.reverse() ];
    setAllTracks(new_tracks)
    setCurrentPage(currentPage + 1)
  }


  const createPlaylist = async () => {
    async function fetchWebApi(endpoint, method, body) {
      const res = await fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        method,
        body:JSON.stringify(body)
      });
      return await res.json();
    }
    
    async function createPrivatePlaylist(tracksUri){
      const { id: user_id } = await fetchWebApi('v1/me', 'GET')

      const playlist = await fetchWebApi(
        `v1/users/${user_id}/playlists`, 'POST', {
          "name": "My playlist",
          "description": "Playlist created with music-swipe",
          "public": false
      })
      
      await fetchWebApi(
        `v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
        'POST'
      );
    
      return playlist;
    }
    
    const createdPlaylist = await createPrivatePlaylist(playlistTracks);
    // console.log(createdPlaylist);
  }

  useEffect(() => {
    setNumberOfTracks((allTracks && allTracks.total) ? allTracks.total : 0);
    setNumberOfPages((allTracks && allTracks.total) ? Math.ceil(allTracks.total / 50) : 0);
  }, [allTracks]);

  if(connected == false) {
    return (
      <>
        <button onClick={() => signIn()}>Sign in</button>
      </>
    )
  }else{
    return (
      <>
        <div className='flex flex-col'>
          <div className="relative w-screen h-[640px] mb-10">
            <audio id="preview-music" src="" preload="auto"></audio>
            {allTracks && allTracks.items ? <>
              {/* Nombre de musiques : {numberOfTracks} <br/>
              Page {currentPage} sur {numberOfPages} */}

              <div className="absolute m-auto left-0 right-0 mx-auto">
                <TinderCard 
                    className={`swipe absolute m-auto left-0 right-0 w-[640px] h-[640px]`}
                    key="loading-card" 
                  >
                    LOADING CARD
                </TinderCard>
                {allTracks.items.reverse().map((item, index) => (
                  <TinderCard 
                    className={`swipe absolute m-auto left-0 right-0 w-[640px] h-[640px]`}
                    key={item.track.id} 
                    ref={childRefs[index]}
                    onSwipe={(dir) => swiped(dir, item.track.id, index)} 
                    preventSwipe={["up", "down"]}
                    swipeRequirementType="position"
                    swipeThreshold={100}
                  >
                    <div className={`w-full h-full relative overflow-hidden rounded-lg bg-cover bg-center`} style={{ backgroundImage: `url(${item.track.album.images[0].url})` }}>
                      <span>Ref: {index}</span>
                      <div className="relative text-white px-6 pb-6 mt-6">
                        <span className="block opacity-75 -mb-1">{item.track.name}</span>
                        <div className="flex justify-between">
                          <span className="block font-semibold text-xl">{item.track.artists.map(artist => artist.name).join(', ')}</span>
                          <button className="bg-white rounded-full text-orange-500 text-xs font-bold px-3 py-2 leading-none flex items-center" onClick={() => playPreview(item.track.preview_url)}>Play</button>
                        </div>
                      </div>
                    </div>
                  </TinderCard>
                ))}
              </div>
            </> : <>
              Aucune musique
            </>}
          </div>   

          <div className="relative text-center">
            {
                currentPage < numberOfPages ? <>
                  <button onClick={() => loadMore()}>Load more</button>
                </> : <>
                  Derniere page
                </>
              }
            <br />
            <button onClick={() => createPlaylist()} className='mb-6'>Créer la playlist</button>

            <br />
            <button onClick={() => signOut()}>Sign out</button>
          </div>  
        </div>    
      </> 
    )
  }
}


export async function getServerSideProps(context) {
  const session = await getSession(context)
  let musics = [];

  async function fetchWebApi(url, method, body) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      method,
      body:JSON.stringify(body)
    });
    return await res.json();
  }

  try {
    async function getSavedTracks(url){
      const v = await fetchWebApi(
        url, 'GET'
      );
      musics.push(v);
      return v;
    }
    
    const savedTracks = await getSavedTracks('https://api.spotify.com/v1/me/tracks?offset=0&limit=50');

    // console.log(musics);

    if(musics[0].error){
      return {
        props : {
          connected: false,
        }
      }
    }

    return {
      props : {
        tracks: savedTracks,
        connected: true,
      }
    }
  } catch(error) {
    // console.log('error: ', error)
    return {
      props : {
        error: true,
        connected: false,
      }
    }
  }  
}
