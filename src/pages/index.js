import { Dropdown } from 'flowbite-react';
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getSession, useSession, signIn, signOut } from "next-auth/react"
import dynamic from "next/dynamic"
import { PlayCircleOutline, PauseCircleOutline, MusicalNoteOutline, TrashOutline, AlbumsOutline } from 'react-ionicons'

const TinderCard = dynamic(() => import('../libs/react-tinder-card.js'), {
  ssr: false
});
const SPOTIFY_LIMIT = 50;
const DEEZER_LIMIT = 25;

export default function Home({connected, total, loved_id, tracks, provider}) {
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [passedTracks, setPassedTracks] = useState([]);
    const [allTracks, setAllTracks] = useState((tracks) ? tracks : []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [started, setStarted] = useState(false);
    const [playlistName, setPlaylistName] = useState('My Custom Playlist');

    const { data: session } = useSession()

    const [currentIndex, setCurrentIndex] = useState(0)
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
    async function fetchDeezerWebApi(endpoint, method, body) {
        const res = await fetch(`https://api.deezer.com/${endpoint}`, {
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
            if(provider == 'spotify'){
                return (await fetchWebApi(
                    `v1/me/tracks?market=FR&limit=${SPOTIFY_LIMIT}&offset=${SPOTIFY_LIMIT * currentPage}`, 'GET'
                    ));
            }else if(provider == 'deezer'){
                return (await fetchDeezerWebApi(
                    `playlist/${loved_id}/tracks?index=${DEEZER_LIMIT * currentPage}`, 'GET'
                    ));
            }
            return []; 
        }
    
        const savedTracks = await getSavedTracks();
        console.log(savedTracks);

        if(savedTracks.error){
            console.log('error on load more');
        }else{
            let _savedTracks = savedTracks.items.map(({ track }, index) => ({
                position: (index + 1) + (SPOTIFY_LIMIT * currentPage),
                id: track.id,
                uri: track.uri,
                name: track.name,
                preview_url: track.preview_url,
                artists: track.artists.map(artist => artist.name).join(', '),
                cover: track.album.images[0].url,
            }));
    
            setAllTracks([...allTracks, ..._savedTracks])

            // Play preview
            const track = [...allTracks, ..._savedTracks][SPOTIFY_LIMIT * currentPage];

            if((track)){
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
        const track = allTracks[(currentIndex) ? currentIndex : 0];
        
        if(isPlaying){
            document.getElementById('preview-music').pause();
        }else{
            document.getElementById('preview-music').setAttribute('src', track.preview_url);
            document.getElementById('preview-music').play();
        }
        setIsPlaying(!isPlaying);
    }

    // Swiped functions
    const swiped = async (direction, index) => {
        const track = allTracks[index];
        const next_track = allTracks[index + 1];

        if((track) && !passedTracks.includes(track.uri)){
            // On stock un tableau des musiques passées pour éviter les duplication
            const passed_arr = passedTracks;
            passed_arr.push(track.uri);
            setPassedTracks(passed_arr);

            childRefs[track.position].current.parentNode.remove()
            
            // On met à jour l'index pour la musique suivante
            updateCurrentIndex(track.position)

            // If liked
            if(direction == "right"){
                const arr = playlistTracks;
                if(!arr.find((el) => el.uri == track.uri)){
                    arr.push(track);
                    setPlaylistTracks(arr);
                }
            }

            // On joue la prochaine musique
            if(next_track && next_track.preview_url && childRefs[track.position + 1].current){
                document.getElementById('preview-music').setAttribute('src', next_track.preview_url);
                document.getElementById('preview-music').play();
                setIsPlaying(true);
            }else{
                await loadMore();
                
                if(track.position == total){
                    document.getElementById('preview-music').pause();
                }
            }

            // On clean le childRefs
            childRefs.shift()
        }
    }

    const updateCurrentIndex = (val) => {
        setCurrentIndex(val)
        currentIndexRef.current = val
    }

    // Create the playlist
    const createPlaylist = async () => {
        async function createPrivatePlaylist(tracksUri){
            if(provider == 'spotify'){
                const playlist = await fetchWebApi(
                    `v1/users/${session.accountId}/playlists`, 'POST', {
                    "name": playlistName,
                    "description": "Playlist created with music-swipe",
                    "public": false
                })
                
                await fetchWebApi(
                    `v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
                    'POST'
                );
                
                return playlist;
            } else if(provider == 'deezer'){
                console.log('create from deezer', session);
        // http://api.deezer.com/playlist/<playlist_id>/tracks?access_token=<access_token>&request_method=post&songs=<track_id>

        
        console.log(session.accessToken);
                const playlist = await fetchDeezerWebApi(
                    `user/${session.accountId}/playlists?access_token=${session.accessToken}`, 'POST', {
                    "title": playlistName,
                    "description": "Playlist created with music-swipe",
                    "public": false
                })
                
                const add_songs = await fetchDeezerWebApi(
                    `playlist/${playlist.id}/tracks?access_token=${session.accessToken}`, 'POST', {
                    "songs": tracksUri.join(','),
                    "description": "Playlist created with music-swipe",
                    "public": false
                })
                console.log(add_songs);
                
                return playlist;
            }

            return false
        }
        const createdPlaylist = await createPrivatePlaylist(playlistTracks.map( e => e.uri ));
        console.log(createdPlaylist);
    }
    
    useEffect(() => {
        setNumberOfPages((allTracks && total) ? Math.ceil(total / ((provider == 'spotify') ? SPOTIFY_LIMIT : DEEZER_LIMIT)) : 0);
    }, [allTracks]);

    /**
     * Render part
     */
    if(connected == false) {
        return (
          <>
            <div className='absolute w-screen h-[calc(100dvh)] bg-primary-900'>
                <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                    <div className='relative w-full h-[calc(100dvh)] overflow-hidden flex flex-col gap-2 items-center justify-center'>
                        <AlbumsOutline
                            color={'#FFF'}
                            height={'48px'}
                            width={'48px'}
                        /> 

                        <h1 className='text-center block font-semibold text-white text-3xl'>Create your ideal<br/> playlist</h1>
                        <button onClick={() => signIn('spotify')} type="button" className="flex group gap-2 items-center justify-center mt-6 text-spotify hover:text-white border border-spotify hover:bg-spotify font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            <svg className='fill-spotify group-hover:fill-white' width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd"><path d="M19.098 10.638c-3.868-2.297-10.248-2.508-13.941-1.387-.593.18-1.22-.155-1.399-.748-.18-.593.154-1.22.748-1.4 4.239-1.287 11.285-1.038 15.738 1.605.533.317.708 1.005.392 1.538-.316.533-1.005.709-1.538.392zm-.126 3.403c-.272.44-.847.578-1.287.308-3.225-1.982-8.142-2.557-11.958-1.399-.494.15-1.017-.129-1.167-.623-.149-.495.13-1.016.624-1.167 4.358-1.322 9.776-.682 13.48 1.595.44.27.578.847.308 1.286zm-1.469 3.267c-.215.354-.676.465-1.028.249-2.818-1.722-6.365-2.111-10.542-1.157-.402.092-.803-.16-.895-.562-.092-.403.159-.804.562-.896 4.571-1.045 8.492-.595 11.655 1.338.353.215.464.676.248 1.028zm-5.503-17.308c-6.627 0-12 5.373-12 12 0 6.628 5.373 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12z"/></svg>
                            Sign in with Spotify
                        </button>
                        <button onClick={() => signIn('deezer')} type="button" className="flex group gap-2 items-center justify-center mt-6 text-deezer hover:text-white border border-deezer hover:bg-deezer font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            <svg className='fill-deezer group-hover:fill-white' width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M451.46,244.71H576V172H451.46Zm0-173.89v72.67H576V70.82Zm0,275.06H576V273.2H451.46ZM0,447.09H124.54V374.42H0Zm150.47,0H275V374.42H150.47Zm150.52,0H425.53V374.42H301Zm150.47,0H576V374.42H451.46ZM301,345.88H425.53V273.2H301Zm-150.52,0H275V273.2H150.47Zm0-101.17H275V172H150.47Z"/></svg>
                            Sign in with Deezer
                        </button>
                    </div>
                </div>
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
                <div className="relative bg-yellow-400 h-[calc(100dvh)] w-screen inset-0 select-none" style={{ height: "-webkit-fill-available" }}>
                    <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                        <div className='relative w-full h-[calc(100dvh)] overflow-hidden'>
                            {/* Heading part  */}
                            <div className='absolute z-[99999] w-100 w-full'>
                                <div className='flex justify-between px-6 pb-6 mt-4'>
                                    <div>
                                        <Dropdown
                                            inline
                                            label={
                                                <img className="w-10 h-10 p-1 rounded-full ring-2 ring-primary-700" src={(session && session.user && session.user.image) ? session.user.image : ''} alt="Spotify avatar" />
                                            }
                                        >
                                            <Dropdown.Header>
                                                <span className="block text-sm">
                                                    Hello <span className='text-primary-700'>{(session && session.user && session.user.name) ? session.user.name : 'stranger'}</span>
                                                </span>
                                            </Dropdown.Header>
                                            
                                            <Dropdown.Item onClick={() => signOut()} className='text-red-600'>
                                                Sign out
                                            </Dropdown.Item>
                                        </Dropdown>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <button data-modal-target="playlistModal" data-modal-toggle="playlistModal" className="flex items-center bg-primary-600 rounded-full p-2" type="button">
                                                <MusicalNoteOutline
                                                    color={'#FFF'}
                                                    height={'32px'}
                                                    width={'32px'}
                                                /> 
                                            </button>
                                            <span className={`${(playlistTracks.length > 0 ? '' : 'hidden')} absolute bottom-0 left-8 transform font-bold flex items-center justify-center translate-y-1/4 w-5 h-5 bg-white rounded-full text-xs text-primary-700`}>{(playlistTracks.length !== 0) ?playlistTracks.length : ''}</span>
                                        </div>

                                        {/* Modal */}
                                        <div id="playlistModal" tabIndex="-1" className="fixed z-[99999] top-0 left-0 right-0 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
                                            <div className="relative w-full max-w-2xl max-h-full">
                                                <div className="relative bg-white rounded-lg shadow">
                                                    <div className="flex items-center justify-between p-5 border-b rounded-t">
                                                        <h3 className="text-xl font-medium text-gray-900">
                                                            Create your playlist from {provider == 'spotify' ? 'Spotify' : 'Deezer'}
                                                        </h3>
                                                        <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" data-modal-hide="playlistModal">
                                                            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                            <span className="sr-only">Close modal</span>
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-6">
                                                        <div className='bg-[#1E073B] overflow-scroll px-5 md:px-10 py-5 rounded-lg h-[55vh]'>
                                                            <h2 className='text-lg font-bold'>{playlistName}</h2>
                                                            <p className='text-sm text-primary'>Playlist created with music-swipe</p>
            
                                                            <div className='mt-5'>
                                                                <ul className='flex flex-col gap-2'>
                                                                    {
                                                                        (playlistTracks.length == 0) ? 
                                                                            <span className='italic text-xs text-gray-400'>It&apos;s too quiet I don&apos;t like it much</span>
                                                                        :
                                                                            playlistTracks.map((item, index) => (
                                                                                <li className='flex items-center justify-between' key={index + 1}>
                                                                                    <div className='flex items-center'>
                                                                                        <span className='text-sm text-primary mr-4 font-bold'>{index + 1}</span>
                                                                                        <div className=''>
                                                                                            <p className=''>{item.name}</p>
                                                                                            <p className='italic text-sm text-primary font-medium'>{item.artists}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <TrashOutline
                                                                                            color={'#FFF'}
                                                                                            height={'16px'}
                                                                                            width={'16px'}
                                                                                            className="cursor-pointer"
                                                                                            onClick={() => setPassedTracks(playlistTracks.splice(index, 1))}
                                                                                        /> 
                                                                                    </div>
                                                                                </li>
                                                                            ))
                                                                    }
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b">
                                                        <input onChange={(e) => setPlaylistName(e.target.value)} type="text" className={`${(playlistTracks.length > 0 ? '' : 'hidden')} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`} placeholder="My playlist name"/>
                                                        <button data-modal-hide="playlistModal" onClick={() => createPlaylist()} type="button" className={`${(playlistTracks.length > 0 ? '' : 'hidden')} text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center`}>Create</button>
                                                        <button data-modal-hide="playlistModal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">Cancel</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
        
                            {started ? 
                                <>
                                    <div className='absolute w-full h-full flex items-center justify-center'>
                                        {
                                            currentPage < numberOfPages ? <>
                                                <div role="status">
                                                    <svg aria-hidden="true" className="w-8 h-8 mr-2 animate-spin text-primary-700 fill-primary-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                                    </svg>
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            </> : <p className='text-primary-700'> You&apos;ve reached the end</p>
                                        }
                                    </div>
        
                                    {allTracks ? 
                                        allTracks.map((item, index) => (
                                            <TinderCard 
                                                className={`swipe absolute m-auto left-0 right-0 w-full h-full`}
                                                key={index}
                                                onSwipe={(dir) => swiped(dir, index)} 
                                                zindex={total - index}
                                                preventSwipe={["up", "down"]}
                                                swipeRequirementType="position"
                                                swipeThreshold={100}
                                            >
                                                <div ref={childRefs[item.position]} className={`w-full h-full relative overflow-hidden bg-cover bg-center`} style={{ backgroundImage: `url(${item.cover})` }}>
                                                    <div className="absolute bottom-0 w-full flex justify-between px-6 pb-6 pt-28 gradientback bg-white">
                                                        <div className="">
                                                            <span className="block font-semibold text-primary-600 text-3xl">{item.name}</span>
                                                            <span className="block italic text-lg font-medium">{item.artists}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TinderCard>
                                        ))
                                    :
                                        <>No favorite music</>
                                    }
        
                                    {/* Play button */}
                                    {( SPOTIFY_LIMIT * currentPage !== currentIndex) ? 
                                        <div className='absolute z-[99998] w-100 w-full bottom-0'>
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
                                    :  ''}
                                    
                                </>
                            : 
                                <>
                                    <div className='flex w-full h-full items-center justify-center bg-white'>
                                        <button onClick={() => startApp()} type="button" className="text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Start</button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>
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
        if(session.provider){
            switch (session.provider) {
                case 'deezer':
                    // Get the 50 last recent saved tracks
                    async function getDeezerPlaylist(url){
                        return await fetchWebApi(url, 'GET');
                    }
                    const deezer_allPlaylists = await getDeezerPlaylist(`https://api.deezer.com/user/${session.accountId}/playlists`);
                    if(deezer_allPlaylists.error){
                        return {
                            props : {
                                connected: false,
                            }
                        }
                    }

                    const loved_playlist = deezer_allPlaylists.data.find((el) => el.is_loved_track == true);
                    if(!loved_playlist){
                        return {
                            props : {
                                tracks : [],
                                total: 0,
                                connected: true,
                                provider: 'deezer'
                            }
                        }
                    }
                    // console.log(loved_playlist);

                    async function getDeezerLovedTracks(url){
                        return await fetchWebApi(url, 'GET');
                    }
                    const loved_tracks = await getDeezerLovedTracks(`https://api.deezer.com/playlist/${loved_playlist.id}/tracks`);
                    if(loved_tracks.error){
                        return {
                            props : {
                                tracks : [],
                                total: 0,
                                connected: true,
                                provider: 'deezer'
                            }
                        }
                    }

                    return {
                        props : {
                            tracks : loved_tracks.data.map((track, index) => ({
                                position: index + 1,
                                id: track.id,
                                uri: track.id,
                                name: track.title,
                                preview_url: track.preview,
                                artists: Array.isArray(track.artist) ? track.artist.map(artist => artist.name).join(', ') : track.artist.name,
                                cover: track.album.cover_big,
                            })),
                            total: loved_playlist.nb_tracks,
                            loved_id: loved_playlist.id,
                            connected: true,
                            provider: 'deezer'
                        }
                    }
                    break;
            
                case 'spotify':
                    // Get the 50 last recent saved tracks
                    async function getSpotifySavedTracks(url){
                        return await fetchWebApi(url, 'GET');
                    }
                    const spotify_savedTracks = await getSpotifySavedTracks(`https://api.spotify.com/v1/me/tracks?offset=0&limit=${SPOTIFY_LIMIT}`);
                    if(spotify_savedTracks.error){
                        return {
                            props : {
                                connected: false,
                            }
                        }
                    }

                    return {
                        props : {
                            tracks : spotify_savedTracks.items.map(({ track }, index) => ({
                                position: index + 1,
                                id: track.id,
                                uri: track.uri,
                                name: track.name,
                                preview_url: track.preview_url,
                                artists: track.artists.map(artist => artist.name).join(', '),
                                cover: track.album.images[0].url,
                            })),
                            total: spotify_savedTracks.total,
                            connected: true,
                            provider: 'spotify'
                        }
                    }
                    break;
        
                default:
                    break;
            }
        }

        return {
            props : {
                connected: false,
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
