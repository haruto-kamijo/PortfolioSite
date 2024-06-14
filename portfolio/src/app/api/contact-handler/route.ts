import { NextResponse } from "next/server"
import nodeMailer from "nodemailer"


export async function POST(request:any) {
	const reqBody = await request.json()
	const { email, name, message } = reqBody

	try{
		const transporter = nodeMailer.createTransport({
			service: "gmail",
				port: 465,
				secure: true,
				auth: {
					user: "kamijoharuto@gmail.com",           // メールアドレス
					pass: "xwxp ucgj sern youh"
				}
		})

		const mailOptions = {
			from: "Portfolio Site",
			to: "kamijoharuto@gmail.com",
			subject: "お問い合わせ",
			text: `名前: ${name} \n\nメールアドレス: ${email} \n\nメッセージ: ${message}`
		}

		const info = await transporter.sendMail(mailOptions)
		return NextResponse.json({message: "成功しました"})
	}catch(err){
		return NextResponse.json({message: "失敗しました"})
	}
}