"use client"
import Header from '@/app/(Components)/Header';
import Footer from '@/app/(Components)/Footer';
import { useState } from "react"


const Contact = () => {
	const [name,setName] = useState("")
	const [email,setEmail] = useState("")
	const [message,setMessage] = useState("")

	const handleSubmit = async(e: { preventDefault: () => void; }) => {
		e.preventDefault()
		try{
			const response = await fetch("https://kamijoharuto.com/api/contact-handler", {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name: name,
					email: email,
					message: message
				})
			})
			const jsonData = await response.json()
			alert("メッセージを送信しました")
		}catch(err){
			alert("メッセージの送信が失敗しました")
		}
	}

	return (
		<div className="flex h-screen p-0 double-gradation">
			<Header title="Kamijo Haruto"></Header>
			<div className="contact-form">
				<h1 className="text-center lg:text-3xl">Contact Form</h1>
				<form className="text-center" onSubmit={handleSubmit}>
					<p className="relative w-screen mt-4 lg:text-xl">name:<br/>
						<input className="lg:text-lg w-64 text-center form-content" value={name} onChange={(e) => setName(e.target.value)} type="text"
									 placeholder="Tanaka Taro" required/>
					</p>
					<p className="relative w-screen mt-4 lg:text-xl">mail:<br/>
						<input className="lg:text-lg w-64 text-center form-content" value={email} onChange={(e) => setEmail(e.target.value)} type="text"
									 placeholder="example@gmail.com"
									 required/>
					</p>
					<p className="relative w-screen mt-4 lg:text-xl">detail:<br/>
						<textarea className="lg:text-lg w-64 text-center form-content" value={message} onChange={(e) => setMessage(e.target.value)} 
											placeholder="How do I order HP?"
											rows={8}
											required></textarea>
					</p>


					<button className="relative lg:text-xl mt-4 submit-button" type="submit">Submit</button>
				</form>
			</div>
			<Footer/>
		</div>
	)
}
export default Contact