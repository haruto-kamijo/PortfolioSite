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
					<h1 className="relative text-3xl z-10 lg:text-7xl bg-emerald-400 w-max pb-2 name-shadow-border">Haruto Kamijo</h1>
				</div>
				<div className="relative text-3xl z-10 lg:text-4xl mt-10 ">
					<p className="relative bg-blue-500 z-10 w-max skills-shadow-border">Skills</p>
					<h2 className="relative text-3xl z-10 lg:text-4xl pt-5 ">
						<p className="mt-3 w-max bg-purple-400 pb-2 skill-fcontents-shadow-border">Game:
							<span className="text-white hover:text-orange-300">Java/Android Studio,</span>
							<span className="text-white hover:text-orange-300">C#/Unity</span>
						</p>
						<p className="mt-4 w-max bg-purple-400 pb-2 skill-contents-shadow-border">Web:
							<span className="text-white hover:text-orange-300">HTML/CSS/JS,</span>
							<span className="text-white hover:text-orange-300">TS/Next.js/Tailwind</span>
						</p>
						<p className="mt-4 w-max bg-purple-400 pb-2 skill-contents-shadow-border">AI:
							<span className="text-white hover:text-orange-300">Python/PyTorch,</span>
							<span className="text-white hover:text-orange-300">Python/TensorFlow/Keras</span>
						</p>
						<p className="mt-4 w-max bg-purple-400 pb-2 skill-contents-shadow-border">Other:
							<span className="text-white hover:text-orange-300">3D Model/Blender,</span>
							<span className="text-white hover:text-orange-300">Design/Illustrator/Photoshop</span>
						</p>
					</h2>
					</div>
			</div>

		</section>
	)
}

export default FV