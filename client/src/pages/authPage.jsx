import React, { useState } from 'react';
import logo from '../assets/desktop-logo.png';
import image1 from '../assets/images/1.jpg';
import image2 from '../assets/images/2.jpg';
import image3 from '../assets/images/3.jpg';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';  
import { api } from '../globalkey';

const AuthPage = () => {
    const navigate = useNavigate();
    const [ err, setError ] = useState( "" );
    const [ loading, setLoader ] = useState( false );
    const [ data, setData ] = useState( {
        "email": "",
        "password": "",
    } )
    const { email, password } = data;
    const changeHandler = ( e ) =>
        {
            setData( { ...data, [ e.target.name ]: e.target.value } )
            setError( "" );
        }
        const login = ( e ) =>
            {
                setLoader( true )
                e.preventDefault();
        
                axios
                    .post( api + `/api/auth/login`,
                        {
                            userEmail: email,
                            userPassword: password
                        }
                    )
                    .then( response =>
                    {
                        if ( response.data.status == 1 )
                        {
                            const myData = response.data;
        
                            for ( const key in myData )
                            {
                                if ( key == "status" )
                                    continue;
                                localStorage.setItem( key.toString(), myData[ key ] );
        
                                navigate( "/video-call" );
                            }
        
                        } else
                        {
                            alert( response.data.message );
                        }
        
                    } )
                    .catch( error =>
                    {
                        alert( error );
                        if ( error.response.status == 403 || error.response.status == 401 )
                        {
                            // Log out process and go to home page
                            localStorage.setItem( "token", null );
                            localStorage.removeItem( 'token' );
                            localStorage.clear();
                            navigate( '/' )
                        } else
                        {
                            alert( error )
                        }
        
                    } );
            }
 
    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Right Half */}
            <div className="w-full md:w-1/2 bg-orange-400 flex flex-col items-center justify-center p-8">
                <div className="mb-12">
                    <img src={logo} alt="Logo" className="w-40 h-auto" />
                </div>
                <div className="flex flex-wrap justify-center mb-12 space-x-4">
                    <img src={image1} alt="Image 1" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full" />
                    <img src={image2} alt="Image 2" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full" />
                    <img src={image3} alt="Image 3" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full" />
                </div>
                <div className="text-center">
                    <div className="bg-white p-6 border border-gray-300 rounded-lg shadow-lg mx-4">
                        <p className="text-lg italic mb-4 text-center">
                        "Your Virtual Meeting Room, Anytime, Anywhere."
                        </p>

                    </div>
                </div>
            </div>

            {/* Left Half */}
            <div className="w-full md:w-1/2 flex flex-col justify-center p-8 bg-white">
                <div className="max-w-sm mx-auto">
                    <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
                    <form onSubmit={login}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={changeHandler}
                                placeholder="Your email"
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={changeHandler}
                                placeholder="Your password"
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={loading}
                        >
                            {loading ? "Logging In..." : "Login"}
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <a href="#" className="text-sm text-blue-500 hover:underline">
                            Forgot Password?
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
