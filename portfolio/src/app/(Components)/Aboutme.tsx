import React from 'react'


// type FVProps = {
// 	developername:string
// 	catchphrase: string
// 	buttonText: string
// }

const Aboutme = () => {

	return (
		<section className="flex-none w-screen h-screen">
			<div className="profile relative">
				<div>
					<h1 className="relative text-3xl z-10 lg:text-6xl bg-emerald-400 w-max pb-2 name-shadow-border">Haruto
						Kamijo</h1>
					<img className="mt-10 ml-10"
						src="/my_image1.jpg"
						width={240}
						height={320}
						alt="My Face image"/>
				</div>
				<div className="absolute text-3xl z-10 lg:text-4xl self-introduction">
					<p className="relative bg-blue-500 ml-10 z-10 w-max self-introduction-shadow">self-introduction</p>
					<h2 className="relative text-xl z-10 lg:text-2xl pt-5">
						<p className="relative bg-indigo-400 mt-6 z-10 w-max self-introduction-topics-shadow">Status</p>
						<p className="mt-3 w-max bg-violet-500 pb-2 skill-fcontents-shadow-border">NUT B3 infomation&management
							system engineering</p>
						<p className="relative bg-indigo-400 mt-4 z-10 w-max self-introduction-topics-shadow">Hobby</p>
						<p
							className="mt-3 w-max bg-violet-500 pb-2 skill-fcontents-shadow-border">Programing,Game,Fashion,Perfume,Camera</p>
						<p className="relative bg-indigo-400 mt-4 z-10 w-max self-introduction-topics-shadow">Language</p>
						<p
							className="mt-3 w-max bg-violet-500 pb-2 skill-fcontents-shadow-border">Python,C,C++,C#,Java,HTML/CSS,JS,TS,R</p>
					</h2>
				</div>
			</div>

		</section>
	)
}

export default Aboutme