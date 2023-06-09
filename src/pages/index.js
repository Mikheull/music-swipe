import React, { useEffect } from 'react'
import { getSession } from "next-auth/react"
import { useDispatch } from "react-redux"

import SignIn from '../components/screen/SignIn';
import Audio from '../components/Audio';
import Navbar from '../components/Navbar';
import StartScreen from '../components/screen/Start';
import PlayerScreen from '../components/screen/Player';

import { setSession, setAuthState } from "../store/authSlice"
import { setPreTracks } from "../store/appSlice"

const SPOTIFY_LIMIT = 50;

export default function Home({spotify_session, connected, pre_tracks}) {
    const dispatch = useDispatch()

    /**
     * Dispatch Session state
     */
    useEffect(() => {
        dispatch(setAuthState(connected))
        dispatch(setPreTracks(pre_tracks))
        
        if(spotify_session){
            dispatch(setSession(spotify_session))
        }
    }, [connected]);

    
    /**
     * Render the app
     */
    if(connected == false) {
        return <SignIn />
    }else{
        return (
            <>
                <Audio />

                <div className="relative bg-[#1E073B] h-[calc(100dvh)] w-screen inset-0 select-none fill-available">
                    <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                        <div className='relative w-full h-[calc(100dvh)] overflow-hidden'>
                            <Navbar />
                            <StartScreen />
                            <PlayerScreen />
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
                spotify_session: session,
                pre_tracks : spotify_savedTracks.items.map(({ track }, index) => ({
                    position: index + 1,
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                })),
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
