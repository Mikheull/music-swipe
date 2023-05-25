import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getSession, useSession, signIn, signOut } from "next-auth/react"
import dynamic from "next/dynamic"
import { PersonCircleOutline, PlayCircleOutline, PauseCircleOutline, MusicalNoteOutline } from 'react-ionicons'

const TinderCard = dynamic(() => import('react-tinder-card'), {
  ssr: false
});
const LIMIT = 25;

export default function Home({connected, total, tracks}) {
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [allTracks, setAllTracks] = useState((tracks) ? tracks.reverse() : []);
    const [isPlaying, setIsPlaying] = useState(false);

    const { data: session } = useSession()

    const [currentIndex, setCurrentIndex] = useState((total) ? total - 1 : 0)
    const currentIndexRef = useRef(currentIndex)
    const childRefs = useMemo(
        () =>
            (total) ? 
                Array(total)
                    .fill(0)
                    .map((i) => React.createRef()) 
            : 
                0,
        []
    )

    /**
     * Method part
     */
    // Fetch Spotify Web API
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

    // Load more music
    const loadMore = async () => {
        async function getSavedTracks(){
            return (await fetchWebApi(
              `v1/me/tracks?market=FR&limit=${LIMIT}&offset=${LIMIT * currentPage}`, 'GET'
            ));
        }

        const savedTracks = await getSavedTracks();

        if(savedTracks.error){
            console.log('error on load more');
        }else{
            let _savedTracks = savedTracks.items.map(({ track }, index) => ({
                position: (index + 1) + (LIMIT * currentPage),
                id: track.id,
                uri: track.uri,
                name: track.name,
                preview_url: track.preview_url,
                artists: track.artists.map(artist => artist.name).join(', '),
                cover: track.album.images[0].url,
            }));
    
            setAllTracks([...allTracks, ..._savedTracks.reverse()])

            // Play preview
            const track = _savedTracks[_savedTracks.length - 1];
            console.log(track, (LIMIT * currentPage) + 1);
            if((track)){
                if(isPlaying){
                    document.getElementById('preview-music').pause();
                }
                
                if(track && track.preview_url){
                    document.getElementById('preview-music').setAttribute('src', track.preview_url);
                    document.getElementById('preview-music').play();
                }
            }
    
            setIsPlaying(true);
            setCurrentPage(currentPage + 1)
        }
    }

    // Play preview music
    const togglePreview = (previewUrl) => {
        if(isPlaying){
            document.getElementById('preview-music').pause();
        }else{
            document.getElementById('preview-music').pause();
            document.getElementById('preview-music').setAttribute('src', previewUrl);
            document.getElementById('preview-music').play();
        }
        setIsPlaying(!isPlaying);
    }

    // Swiped functions
    const swiped = (direction, index) => {
        const track = allTracks[index - 1];

        if((track) && !playlistTracks.includes(track.uri)){
            if(direction == "right"){
                const arr = playlistTracks;
                arr.push(track.uri);
                setPlaylistTracks(arr);
            }
        
            if(isPlaying){
                document.getElementById('preview-music').pause();
            }
            
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
                setIsPlaying(true);
            }
        }
    }


    // Create the playlist
    const createPlaylist = async () => {
        async function createPrivatePlaylist(tracksUri){
        const { id: user_id } = await fetchWebApi('v1/me', 'GET')

        const playlist = await fetchWebApi(
            `v1/users/${user_id}/playlists`, 'POST', {
            "name": "Mika Playlist :)",
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
        setNumberOfPages((allTracks && total) ? Math.ceil(total / LIMIT) : 0);
    }, [allTracks]);

    /**
     * Render part
     */
    if(connected == false) {
        return (
          <>
            <button onClick={() => signIn()}>Sign in</button>
          </>
        )

    // Si l'user est connecté
    }else{
        return (
            <>
                {/* Audio part */}
                <audio id="preview-music" src="" preload="auto"></audio>

                {/* Tracks part*/}
                <div className="relative bg-yellow-400 h-screen w-screen py-10">
                    <div className="mx-auto max-w-lg bg-blue-200 h-full">
                        <div className='flex justify-between'>
                            <div>
                                <PersonCircleOutline
                                    color={'#000'}
                                    height={'32px'}
                                    width={'32px'}
                                />
                            </div>
                            <div>
                                <MusicalNoteOutline
                                    color={'#000'}
                                    height={'32px'}
                                    width={'32px'}
                                />
                            </div>
                        </div>

                        <div className='relative w-full h-full mt-4 overflow-hidden'>
                            {/* Partie temporaire du load more */}
                            <div className='absolute w-full h-full flex items-center justify-center'>
                                {
                                    currentPage < numberOfPages ? <>
                                        <button onClick={() => loadMore()}>Load more</button> ({currentPage}/{Math.ceil(total / LIMIT) })
                                    </> : <> Derniere page</>
                                }
                            </div>

                            {allTracks ? 
                                allTracks.map((item, index) => (
                                    <TinderCard 
                                        className={`swipe absolute m-auto left-0 right-0 w-full h-full`}
                                        key={index}
                                        ref={childRefs[item.position]}
                                        onSwipe={(dir) => swiped(dir, index)} 
                                        preventSwipe={["up", "down"]}
                                        swipeRequirementType="position"
                                        swipeThreshold={100}
                                    >
                                        <div className={`w-full h-full relative overflow-hidden rounded-lg bg-cover bg-center`} style={{ backgroundImage: `url(${item.cover})` }}>
                                            <div className="absolute bottom-0 w-full flex justify-between px-6 pb-6 mt-6">
                                                <div className="">
                                                    <span>{item.position} - {index}</span>
                                                    <span className="block">{item.name}</span>
                                                    <span className="block font-semibold text-xl">{item.artists}</span>
                                                </div>

                                                <button className="p-0" onClick={() => togglePreview(item.preview_url)}>
                                                    {!isPlaying ? 
                                                        <PlayCircleOutline
                                                            color={'#FFF'}
                                                            height={'32px'}
                                                            width={'32px'}
                                                        />
                                                    :
                                                        <PauseCircleOutline
                                                            color={'#FFF'}
                                                            height={'32px'}
                                                            width={'32px'}
                                                        />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </TinderCard>
                                ))
                            :
                                <>Aucune musique </>
                            }
                        </div>
                        
                    </div>

                </div>
                

                {JSON.stringify(playlistTracks)}
                {playlistTracks.length > 0 ? <>
                    <br/><button onClick={() => createPlaylist()} className='mb-6'>Créer la playlist</button>
                </> : ''}
                
                <br/><br/> <button onClick={() => signOut()}>Sign out</button>
                
            </>
        )
    }
}


export async function getServerSideProps(context) {
    const session = await getSession(context)

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
        // Get the 50 last recent saved tracks
        async function getSavedTracks(url){
            return await fetchWebApi(url, 'GET');
        }
        const savedTracks = await getSavedTracks(`https://api.spotify.com/v1/me/tracks?offset=0&limit=${LIMIT}`);
        if(savedTracks.error){
            return {
                props : {
                    connected: false,
                }
            }
        }

        return {
            props : {
                tracks : savedTracks.items.map(({ track }, index) => ({
                    position: index + 1,
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                })),
                total: savedTracks.total,
                connected: true,
            }
        }
    } catch(error) {
        return {
            props : {
                connected: false,
            }
        }
    }  
}
