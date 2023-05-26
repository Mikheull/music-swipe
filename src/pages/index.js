import { Dropdown } from 'flowbite-react';
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
    const [playlistTracksFull, setPlaylistTracksFull] = useState([]);
    const [allTracks, setAllTracks] = useState((tracks) ? tracks : []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [started, setStarted] = useState(false);

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
        [tracks]
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

    // Start the app
    const startApp = async () => {
        setStarted(true);
        setIsPlaying(true);

        const track = tracks[0];
        if((track)){
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
            }
        }
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
    
            setAllTracks([...allTracks, ..._savedTracks])

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
    const togglePreview = () => {
        const track = allTracks[(currentIndex) ? currentIndex : 1];
        console.log(currentIndex, (currentIndex) ? 0 : 1, track);
        
        const previewUrl = '';
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
        const track = allTracks[index];
        const next_track = allTracks[index - 1];

        if((track) && !playlistTracks.includes(track.uri)){
            console.log(track.name);

            updateCurrentIndex(track.position + 1)
            if(childRefs[track.position + 1].current){
                childRefs[track.position + 1].current.parentNode.classList.remove('hidden');
            }else{
                document.getElementById('preview-music').pause();
            }

            if(direction == "right"){
                const arr = playlistTracks;
                arr.push(track.uri);
                setPlaylistTracks(arr);

                const arrFull = playlistTracksFull;
                arrFull.push(track);
                setPlaylistTracksFull(arrFull);
            }
        
            if(isPlaying){
                document.getElementById('preview-music').pause();
            }
            
            if(next_track && next_track.preview_url && childRefs[track.position + 1].current){
                document.getElementById('preview-music').setAttribute('src', next_track.preview_url);
                document.getElementById('preview-music').play();
                setIsPlaying(true);
            }
        }
    }


    const updateCurrentIndex = (val) => {
        setCurrentIndex(val)
        currentIndexRef.current = val
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
            <div className='absolute w-screen h-screen flex items-center justify-center bg-white'>
                <button onClick={() => signIn('spotify')} type="button" className="text-white bg-[#9658c2] hover:bg-[#C996EE] font-medium rounded-lg text-sm px-5 py-2.5 text-center">Sign in</button>
            </div>
          </>
        )

    // Si l'user est connecté
    }else{
        return (
            <>
                {/* Audio part */}
                <audio id="preview-music" src="" preload="auto"></audio>

                {/* Tracks part*/}
                <div className="relative bg-yellow-400 h-screen w-screen select-none">
                    <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                        <div className='relative w-full h-screen overflow-hidden'>
                            {/* Start part */}
                            {started ? 
                                <>
                                    {/* Heading part  */}
                                    <div className='absolute z-10 w-100 w-full'>
                                        <div className='flex justify-between px-6 pb-6 mt-4'>
                                            <div>
                                                <Dropdown
                                                    inline
                                                    label={
                                                        <PersonCircleOutline
                                                            color={'#FFF'}
                                                            height={'32px'}
                                                            width={'32px'}
                                                        />
                                                    }
                                                >
                                                    <Dropdown.Header>
                                                        <span className="block text-sm">
                                                            Hello {(session && session.user && session.user.name) ? session.user.name : 'stranger'}
                                                        </span>
                                                    </Dropdown.Header>
                                                    
                                                    <Dropdown.Item onClick={() => signOut()}>
                                                        Sign out
                                                    </Dropdown.Item>
                                                </Dropdown>
                                            </div>
                                            <div>
                                                <button data-modal-target="playlistModal" data-modal-toggle="playlistModal" className="bl flex items-center" type="button">
                                                    <MusicalNoteOutline
                                                        color={'#FFF'}
                                                        height={'32px'}
                                                        width={'32px'}
                                                    /> 
                                                    <span className='text-xs text-[#C996EE]'>{(playlistTracks.length !== 0) ?playlistTracks.length : ''}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Modal */}
                                    <div id="playlistModal" tabIndex="-1" className="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-5vh)]">
                                        <div className="relative w-full max-w-4xl max-h-full">
                                            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                                                <div className="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-600">
                                                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                                                        Create the playlist
                                                    </h3>
                                                    <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="playlistModal">
                                                        <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                        <span className="sr-only">Close modal</span>
                                                    </button>
                                                </div>
                                                <div className="p-6 space-y-6">
                                                    <div className='bg-[#1E073B] overflow-scroll px-10 py-5 rounded-lg h-[60vh]'>
                                                        <h2 className='text-lg font-bold'>My custom playlist</h2>
                                                        <p className='text-sm text-[#C996EE]'>Playlist created with music-swipe</p>
        
                                                        <div className='mt-5'>
                                                            <ul className='flex flex-col gap-2'>
                                                                {
                                                                    (playlistTracksFull.length == 0) ? 
                                                                        <>
                                                                        Empty playlist
                                                                        </>
                                                                    :
                                                                        playlistTracksFull.map((item, index) => (
                                                                            <li className='flex items-center' key={index + 1}>
                                                                                <span className='text-sm text-[#C996EE] mr-4 font-bold'>{index + 1}</span>
                                                                                <div className=''>
                                                                                    <p className=''>{item.name}</p>
                                                                                    <p className='italic text-sm text-[#C996EE] font-medium'>{item.artists}</p>
                                                                                </div>
                                                                            </li>
                                                                        ))
                                                                }
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                                                    {playlistTracks.length > 0 ? <>
                                                        <button data-modal-hide="playlistModal" onClick={() => createPlaylist()} type="button" className="text-white bg-[#9658c2] hover:bg-[#C996EE] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Process</button>
                                                    </> : ''}
                                                    <button data-modal-hide="playlistModal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
        
                                    {/* Partie temporaire du load more */}
                                    <div className='absolute w-full h-full flex items-center justify-center'>
                                        {
                                            currentPage < numberOfPages ? <>
                                                <button onClick={() => loadMore()} className='text-[#C996EE] underline mr-2'>Load more</button> (Page <span className='text-[#C996EE] mx-2'>{currentPage}</span> sur <span className='text-[#C996EE] ml-2'>{Math.ceil(total / LIMIT) }</span>)
                                            </> : <> Derniere page</>
                                        }
                                    </div>
        
                                    {allTracks ? 
                                        allTracks.map((item, index) => (
                                            <TinderCard 
                                                className={`swipe absolute m-auto left-0 right-0 w-full h-full ${item.position == 1 || currentPage !== 1 ? '' : 'hidden'}`}
                                                key={index}
                                                onSwipe={(dir) => swiped(dir, index)} 
                                                preventSwipe={["up", "down"]}
                                                swipeRequirementType="position"
                                                swipeThreshold={100}
                                            >
                                                <div ref={childRefs[item.position]} className={`w-full h-full relative overflow-hidden bg-cover bg-center`} style={{ backgroundImage: `url(${item.cover})` }}>
                                                    <div className="absolute bottom-0 w-full flex justify-between px-6 pb-6 mt-6">
                                                        <div className="">
                                                            <span>{item.position} - {index}</span>
                                                            <span className="block">{item.name}</span>
                                                            <span className="block font-semibold text-xl">{item.artists}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TinderCard>
                                        ))
                                    :
                                        <>Aucune musique </>
                                    }
        
                                    {/* Play button */}
                                    <div className='absolute z-10 w-100 w-full bottom-0'>
                                        <div className='flex justify-between px-6 pb-6 mt-4'>
                                            <div></div>
                                            <button className="p-0" onClick={() => togglePreview()}>
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
                                </> 
                            : 
                                <>
                                    <div className='flex w-full h-full items-center justify-center bg-white'>
                                            <button onClick={() => startApp()} type="button" className="text-white bg-[#9658c2] hover:bg-[#C996EE] font-medium rounded-lg text-sm px-5 py-2.5 text-center">Start</button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>


                <div className=''>
                    {
                        currentPage < numberOfPages ? <>
                            <button onClick={() => loadMore()} className='text-[#C996EE] underline mr-2'>Load more</button> (Page <span className='text-[#C996EE] mx-2'>{currentPage}</span> sur <span className='text-[#C996EE] ml-2'>{Math.ceil(total / LIMIT) }</span>)
                        </> : <> Derniere page</>
                    }
                </div>
                {allTracks ? 
                    allTracks.map((item, index) => (
                        <>
                            <div><span>item {item.position}</span> ({index}) : <span>{item.name}</span></div>
                        </>
                    ))
                :
                    'a'
                }
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
