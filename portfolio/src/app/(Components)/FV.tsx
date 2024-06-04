import React from 'react'


// type FVProps = {
// 	developername:string
// 	catchphrase: string
// 	buttonText: string
// }

const FV = () => {

	return (
		<section className="flex-none w-screen h-screen">
			<div className="profile relative">
				<div>
					<h1 className="relative text-3xl z-10 lg:text-7xl bg-emerald-400 w-max pb-2">Haruto Kamijo</h1>
					{/*shadow*/}
					<h1 className="text-3xl z-0 lg:text-7xl name-shadow absolute bg-black -top-2 left-3 w-max text-black pb-2 ">Haruto Kamiio</h1>
					
				</div>
				<div className="relative text-3xl z-10 lg:text-5xl mt-12">
					<p className="relative bg-blue-500 z-10 w-max">Skills</p>
					{/*shadow*/}
					<p className="absolute bg-black top-2 left-2 w-max text-black">Skills</p>
					
					<h2 className="relative text-3xl z-10 lg:text-5xl mt-7 ">
						<p className="mt-4 w-max bg-purple-400 pb-2">Game:<span className="text-white hover:text-orange-300">Java/Android Studio,</span><span
							className="text-white hover:text-orange-300">C#/Unity</span></p>
						<p className="mt-3 w-max bg-purple-400 pb-2">Web:<span
							className="text-white hover:text-orange-300">HTML/CSS/JS,</span><span
							className="text-white hover:text-orange-300">TS/Next.js/Tailwind</span></p>
						<p className="mt-3 w-max bg-purple-400 pb-2">AI:<span
							className="text-white hover:text-orange-300">Python/PyTorch,</span><span
							className="text-white hover:text-orange-300">Python/TensorFlow/Keras</span></p>
						<p className="mt-3 w-max bg-purple-400 pb-2">Other:<span className="text-white hover:text-orange-300">3D Model/Blender,</span><span
							className="text-white hover:text-orange-300">Design/Illustrator/Photoshop</span></p>
					</h2>
					<div>{/*shadow*/}
						<h2 className="absolute top-12 left-2 text-3xl z-0 lg:text-5xl mt-5 text-black">
						<p className="mt-4 w-max bg-black pb-2">Game:<span className="text-black">Java/Android Studio,</span><span
							className="text-black">C#/Unity</span></p>
						<p className="mt-3 w-max bg-black pb-2">Web:<span
							className="text-black">HTML/CSS/JS,</span><span
							className="text-black">TS/Next.js/Tailwind</span></p>
						<p className="mt-3 w-max bg-black pb-2">AI:<span
							className="text-black">Python/PyTorch,</span><span
							className="text-black0">Python/TensorFlow/Keras</span></p>
						<p className="mt-3 w-max bg-black pb-2">Other:<span className="text-black">3D Model/Blender,</span><span
							className="text-black">Design/Illustrator/Photoshop</span></p>
					</h2>
						
					</div>

				</div>
			</div>

		</section>
	)
}

export default FV