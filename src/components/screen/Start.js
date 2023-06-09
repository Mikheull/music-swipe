import React, { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce';
import { ArrowForwardCircleOutline } from 'react-ionicons'
import Image from 'next/image';

import { selectSession } from "../../store/authSlice"
import { 
    selectIsStarted, setIsStarted, 
    setIsPlaying, 
    setIsFinish,
    setAppMode,
    selectPreTracks, 
    setTracksList, 
    selectSearchResult, setSearchResult,
    setSearchResultUsed,
    setNumberOfPage,
    setCurrentIndex,
    setTotal,
    setCurrentPage } from "../../store/appSlice"
import { useDispatch, useSelector } from "react-redux"

import fetchWebApi from '../../controller/fetchWebApi'

const SPOTIFY_LIMIT = 50;

const StartScreen = () => {
    const [displayBgCover, setDisplayBgCover] = useState(null);

	/**
	 * Redux State
	 */
	const session = useSelector(selectSession)
	const pre_tracks = useSelector(selectPreTracks)
	const search_result = useSelector(selectSearchResult)
	const isStarted = useSelector(selectIsStarted)
	const dispatch = useDispatch()

    /**
     * Debouce and search a playlist
     */
    const debounced = useDebouncedCallback(
        async (value) => {
            if(value.length !== 0){
                async function search_playlist(){
                    return (await fetchWebApi(
                        `v1/search?q=${value}&type=playlist&limit=25`, 
                        'GET', 
                        session.accessToken
                        ));
                }
        
                const finded_playlist = await search_playlist();
                if(finded_playlist.error){
                    dispatch(setSearchResult([]))
                }else{
                    dispatch(setSearchResult(finded_playlist.playlists.items))
                }
            }else{
                dispatch(setSearchResult([]))
            }
        }, 300
    );


	/**
	 * Display a grid of random tracks cover in background
	 */
    const displayCoverBackground = () => {
        if(pre_tracks && pre_tracks.length > 1){
            const covers = shuffleArr(pre_tracks.map((track, index) => ({
                cover: track.cover,
            })));

            return (
                <>
                    <div className='bg-gradient-to-b from-[#1E073B] to-primary-900 w-full h-full absolute z-0 '>
                        <div>
                            <div className={`m-auto left-0 right-0 absolute -top-[4rem] flex justify-center gap-[4rem]`}>
                                <div data-cover-position="1" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[0] && covers[0].cover) ? covers[0].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="2" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[1] && covers[1].cover) ? covers[1].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[0rem] top-[4rem] absolute flex justify-center gap-[4rem] w-full`}>
                                <div data-cover-position="3" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -left-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[2] && covers[2].cover) ? covers[2].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="4" className='opacity-50 bg-cover bg-center h-32 w-32 absolute rounded-full' style={{ backgroundImage: `url(${(covers[3] && covers[3].cover) ? covers[3].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="5" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -right-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[4] && covers[4].cover) ? covers[4].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className={`m-auto left-0 right-0 absolute top-[12rem] flex justify-center gap-[4rem]`}>
                                <div data-cover-position="6" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[5] && covers[5].cover) ? covers[5].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="7" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[6] && covers[6].cover) ? covers[6].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[0rem] top-[20rem] absolute flex justify-center gap-[4rem] w-full`}>
                                <div data-cover-position="8" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -left-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[7] && covers[7].cover) ? covers[7].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="9" className='opacity-50 bg-cover bg-center h-32 w-32 absolute rounded-full' style={{ backgroundImage: `url(${(covers[8] && covers[8].cover) ? covers[8].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="10" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -right-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[9] && covers[9].cover) ? covers[9].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className={`m-auto left-0 right-0 absolute top-[28rem] flex justify-center gap-[4rem]`}>
                                <div data-cover-position="11" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[10] && covers[10].cover) ? covers[10].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="12" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[11] && covers[11].cover) ? covers[11].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[0rem] top-[36rem] absolute flex justify-center gap-[4rem] w-full`}>
                                <div data-cover-position="13" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -left-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[12] && covers[12].cover) ? covers[12].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="14" className='opacity-50 bg-cover bg-center h-32 w-32 absolute rounded-full' style={{ backgroundImage: `url(${(covers[13] && covers[13].cover) ? covers[13].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="15" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -right-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[14] && covers[14].cover) ? covers[14].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 w-full h-full flex justify-between px-6 pb-6 gradientback"></div>
                    </div>
                </>
            )
        }
    }

    function shuffleArr (array){
        for (var i = array.length - 1; i > 0; i--) {
            var rand = Math.floor(Math.random() * (i + 1));
            [array[i], array[rand]] = [array[rand], array[i]]
        }
        return array
    }

    useEffect(() => {
        setDisplayBgCover(displayCoverBackground());
    }, [pre_tracks]);


    /**
     * Start App with different mode (saved_tracks & playlist)
     */
    const startApp = async (mode, id = '') => {
        dispatch(setIsStarted(true))
        dispatch(setIsPlaying(true))
        dispatch(setAppMode(mode))

        let __trackslist = [];

        if(mode == 'playlist'){
            const finded_playlist = await fetchWebApi(
                `v1/playlists/${id}`, 
                'GET', 
                session.accessToken
            );

            if(finded_playlist.error){
                console.log('erreur on start app');
            }else{
                __trackslist = finded_playlist.tracks.items.map(({ track }, index) => ({
                    position: (index + 1),
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                }));

                dispatch(setSearchResultUsed(id))
                dispatch(setTracksList(__trackslist))
                dispatch(setNumberOfPage((finded_playlist && finded_playlist.tracks.total) ? Math.ceil(finded_playlist.tracks.total / SPOTIFY_LIMIT) : 0))
                dispatch(setTotal(finded_playlist.tracks.total))
                dispatch(setCurrentPage((finded_playlist.tracks.total <= SPOTIFY_LIMIT) ? 1 : 2))
            }
        }
        
        if(mode == 'saved_tracks'){
            const finded_playlist = await fetchWebApi(
                `v1/me/tracks?offset=0&limit=${SPOTIFY_LIMIT}`, 
                'GET', 
                session.accessToken
            );

            if(finded_playlist.error){
                console.log('erreur en start app');
            }else{
                __trackslist = finded_playlist.items.map(({ track }, index) => ({
                    position: (index + 1),
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                }));
    
                dispatch(setTracksList(__trackslist))
                dispatch(setNumberOfPage((finded_playlist && finded_playlist.total) ? Math.ceil(finded_playlist.total / SPOTIFY_LIMIT) : 0))
                dispatch(setTotal(finded_playlist.total))
                dispatch(setCurrentPage(1))
            }
        }

        const track = __trackslist[0];
        if((track)){
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
                // document.getElementById('preview-music').volume = 0.05;
            }
        }

    }


	/**
     * Continue App with playlist mode
     */
    const continueApp = async (id = '') => {
        dispatch(setIsPlaying(true))
        dispatch(setAppMode('playlist'))
        dispatch(setIsFinish(false))
        dispatch(setCurrentIndex(0))

        // On reset les styles des cartes
        var elems = document.querySelectorAll('.trackcard');
        var index = 0, length = elems.length;
        for ( ; index < length; index++) {
            elems[index].style.transition = "";
            elems[index].style.transform = "translate3d(0px, 0px, 0px) rotate(0deg)";
        }
        
        let __trackslist = [];
        const finded_playlist = await fetchWebApi(
            `v1/playlists/${id}`, 
            'GET', 
            session.accessToken
        );
        
        if(finded_playlist.error){
            console.log('erreur on continue app');
        }else{
            __trackslist = finded_playlist.tracks.items.map(({ track }, index) => ({
                position: (index + 1),
                id: track.id,
                uri: track.uri,
                name: track.name,
                preview_url: track.preview_url,
                artists: track.artists.map(artist => artist.name).join(', '),
                cover: track.album.images[0].url,
            }));

            dispatch(setSearchResultUsed(id))
            dispatch(setTracksList(__trackslist))
            dispatch(setNumberOfPage((finded_playlist && finded_playlist.tracks.total) ? Math.ceil(finded_playlist.tracks.total / SPOTIFY_LIMIT) : 0))
            dispatch(setTotal(finded_playlist.tracks.total))
            dispatch(setCurrentPage((finded_playlist.tracks.total <= SPOTIFY_LIMIT) ? 1 : 2))
        }

        const track = __trackslist[0];
        if((track)){
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
                // document.getElementById('preview-music').volume = 0.05;
            }
        }
    }


	/**
	 * Render the Start screen
	 */
	return (
        <>
            <div className={`${!isStarted ? '' : 'hidden' } flex w-full h-full items-center justify-center bg-white relative`}>
                {displayBgCover}

                <div className='z-[99998] w-3/4'>
                    <button onClick={() => startApp('saved_tracks')} type="button" className="mx-auto flex group gap-2 items-center justify-center mt-6 text-black hover:text-spotify hover:bg-white bg-spotify font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Continue with saved tracks
                    </button>

                    <div className="relative flex py-5 items-center w-full">
                        <div className="flex-grow border-t border-primary-400"></div>
                        <span className="flex-shrink mx-4 text-primary-400 font-powergrotesk">OR</span>
                        <div className="flex-grow border-t border-primary-400"></div>
                    </div>

                    <div>
                        <div className='flex justify-center'>
                            <button data-modal-target="searchplaylistModal" data-modal-toggle="searchplaylistModal" className="underline decoration-primary font-powergrotesk" type="button">
                                Search a playlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <div id="searchplaylistModal" tabIndex="-1" aria-hidden="true" className="fixed top-0 left-0 right-0 z-[99999] hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
                <div className="relative w-full max-w-md max-h-full">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="searchplaylistModal">
                            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                        <div className="px-6 py-6 lg:px-8">
                            <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Search a playlist</h3>
                                                                                                        
                            <div>
                                <input className='rounded-lg bg-gray-50 border text-gray-900 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5' placeholder="Top 50 France" onChange={(e) => debounced(e.target.value)} />
                                {
                                    (search_result && search_result.length !== 0) ? 
                                        <div className='overflow-scroll h-[55vh] mt-6'>
                                        {search_result.map((item, index) => (
                                            <div key={index} className='flex items-center justify-between mb-2'>
                                                <div className='flex gap-2'>
                                                    <Image
                                                        src={(item.images) ? item.images[0].url : ''}
                                                        width={64}
                                                        height={64}
                                                        className='p-1 rounded-lg'
                                                        alt="Spotify playlist cover"
                                                    />
                                                    <div>
                                                        <p className='text-xs text-gray-800'>{item.name} ({item.tracks.total})</p>
                                                        <p className='italic text-xs text-primary font-medium'>Par - {item.owner.display_name}</p>
                                                    </div>
                                                </div>

                                                <button type="button" data-modal-hide="searchplaylistModal" onClick={() => (!isStarted) ? startApp('playlist', item.id) : continueApp(item.id) }>
                                                    <ArrowForwardCircleOutline
                                                        color={'#000'}
                                                        height={'24px'}
                                                        width={'24px'}
                                                        className="cursor-pointer"
                                                    /> 
                                                </button>
                                            </div>
                                        ))}
                                        </div> 
                                    : <p className='mt-6 text-primary text-sm'>Aucun résultats</p>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
        </>
	)
}

export default StartScreen
