import { useEffect, useState } from "react";
import { PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline'


let user_id = localStorage.getItem('user_id')

let socket = new WebSocket(
    `ws://127.0.0.1:8000/ws/users/${user_id}/chat/`
);

let typingTimer = 0;
let isTypingSignalSent = false;

export default function ChatScreen() {

    const [chatRooms, setChatRooms] = useState([])
    const [inputMessage, setInputMessage] = useState("");
    const [roomId, setRoomId] = useState(null)
    const [messages, setMessages] = useState([])
    const [typing, setTyping] = useState(false);

    const [page, setPage] = useState(null)
    const [user, setUser] = useState(null)

    useEffect(() => {
        let user_id = localStorage.getItem('user_id')

        if (user_id) {
            setUser(user_id)
            setPage('chat')
            getChatRooms()
            socket = new WebSocket(
                `ws://127.0.0.1:8000/ws/users/${user_id}/chat/`
            );
        } else {
            setPage('login')
        }
    }, [user])

    async function getChatRooms() {
        await fetch(`http://127.0.0.1:8000/chat/rooms/${user}/`, {
            method: 'GET'
        }).then((response) => {
            return response.json()
        }).then(data => {
            setChatRooms(data)
        }).catch(error => {
            console.log('error----- ', error)
        });
    }

    async function getMessagesByChatRooms(roomId) {
        await fetch(`http://127.0.0.1:8000/chat/room/${roomId}/messages`, {
            method: 'GET'
        }).then((response) => {
            return response.json()
        }).then(data => {
            console.log('message data----- ', data)
            setMessages(data)
        }).catch(error => {
            console.log('error----- ', error)
        });
    }


    useEffect(() => {
        getMessagesByChatRooms(roomId)
    }, [roomId])

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (roomId === data.roomId) {
            if (data.action === "message") {
                setMessages((prevState) => {
                    let messagesState = JSON.parse(JSON.stringify(prevState));
                    console.log('messagesState', messagesState)
                    console.log('data', data)
                    messagesState.push(data);
                    return messagesState;
                });
                setTyping(false);
            } else if (data.action === "typing" && data.user !== user_id) {
                setTyping(data.typing);
            }
        }
    }

    const messageSubmitHandler = (event) => {
        event.preventDefault();
        if (roomId !== null) {
            if (inputMessage) {
                socket.send(
                    JSON.stringify({
                        action: "message",
                        message: inputMessage,
                        user: user_id,
                        roomId: roomId,
                    })
                );
            }
            setInputMessage("");
        }
    };

    const sendTypingSignal = (typing) => {
        socket.send(
            JSON.stringify({
                action: 'typing',
                typing: typing,
                user: user_id,
                roomId: roomId,
            })
        );
    };

    const chatMessageTypingHandler = (event) => {
        if (event.keyCode !== 13) {
            if (!isTypingSignalSent) {
                sendTypingSignal(true);
                isTypingSignalSent = true;
            }
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                sendTypingSignal(false);
                isTypingSignalSent = false;
            }, 3000);
        } else {
            clearTimeout(typingTimer);
            isTypingSignalSent = false;
        }
    };

    const Login = async () => {
        var email = document.getElementById('email').value
        var password = document.getElementById('password').value
        console.log(email, password)
        var loginCredentials = {
            email: email,
            password: password
        }
        var response_data
        await fetch('http://127.0.0.1:8000/accounts/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginCredentials)
        }).then((response) => {
            return response.json();
        }).then(data => {
            response_data = data
            setUser(response_data.user_id)
            localStorage.setItem('user_id', response_data.user_id)
        }).catch(error => {
            response_data = error
        });
    }

    return (
        <>
            {page === 'chat' ?
                <div className="w-fit mx-auto border border-black flex gap-0 flex items-center justify-center">
                    <div className="border border-r-black h-[550px] w-[200px]">
                        <div className="p-4 font-bold text-xl">Chats</div>
                        <hr></hr>
                        {chatRooms.length !== 0 ?
                            <>
                                {chatRooms.map((item, index) => (
                                    <>
                                        <div className={roomId === item.roomId ? "flex items-center justify-center m-4 px-4 py-1 rounded bg-red-300" : "flex m-4 px-4 py-1"}>
                                            <UserCircleIcon width={30} height={30} className="" />
                                            <div key={index}
                                                className={"text-xl w-[100px] px-2 py-[2px] cursor-pointer"}
                                                onClick={() => {
                                                    setRoomId(item.roomId);
                                                    console.log('room--------- ', roomId)
                                                }}
                                            >
                                                {String(item.member[0].id) === user ? item.member[1].first_name : item.member[0].first_name}
                                            </div>
                                        </div>
                                    </>
                                ))}
                            </>
                            : <div>
                            </div>
                        }
                    </div>
                    <div className="">
                        <div className="p-4 font-bold text-xl">Messages</div>
                        <div className="h-[450px]  flex flex-col gap-4 px-4 py-2">
                            <hr></hr>
                            {messages.length !== 0 ?
                                <div>
                                    {messages.map((data) => (
                                        <>
                                            <div className={String(data.user) === user_id ? "rounded px-4 text-wrap flex justify-end" : "rounded bg-gray-200 px-4 w-fit"} >
                                                <div className={String(data.user) === user_id ? "max-w-[50%] min-w-[50%] border px-4 my-1 text-right" : "my-1"}>
                                                    <div className="font-bold"> {data.userName}</div>
                                                    {data.message}
                                                </div>
                                            </div>
                                        </>
                                    ))}
                                </div>
                                : <div className="ml-[230px]">No messages</div>}
                        </div>
                        <div >
                            {typing && (
                                <>
                                    <div>typing...</div>
                                </>
                            )}
                        </div>
                        <div className="px-4 flex items-center gap-2">
                            <input
                                type="text"
                                className="border border-black rounded h-[30px] w-[450px]"
                                onChange={(event) => setInputMessage(event.target.value)}
                                onKeyUp={chatMessageTypingHandler}
                                value={inputMessage}
                            />
                            <button
                                id="send-btn"
                                className="px-4 bg-green-300 mx-4 rounded"
                                onClick={(e) => messageSubmitHandler(e)}
                            >Send</button>
                        </div>
                    </div>
                </div>
                :
                <div className="">
                    <div className=" w-fit mx-auto">
                        <div className="flex flex-col items-center my-10 gap-3">
                            <input id='email' type="text" placeholder="email" className="px-2 w-[300px] h-10 border border-black rounded" />
                            <input id='password' type="password" placeholder="password" className="px-2 w-[300px] h-10 border border-black rounded" />
                            <button
                                onClick={Login}
                                className="px-6 py-1 bg-black text-white rounded my-4"
                            >Login</button>
                        </div>
                    </div>
                </div>}
        </>
    )
}