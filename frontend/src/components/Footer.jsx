import { assets } from "../assets/assets"


const Footer = () => {
  return (
    <div className="md:mx-10">
        <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
            {/* left section */}
            <div>
                <img className="mb-5 w-40" src={assets.logo} alt=""/>
                <p className="w-full md:w-2/3 text-gray-600 leadinng-6 ">At CareHive, we believe that health and wellness should be
                  accessible to everyone. Our platform is designed to bring together a community of healthcare professionals, wellness
                  enthusiasts, and individuals seeking trusted health advice, support, and resources.
                </p>

            </div>

            {/* center section */}
            <div>
                <p className="text-xl font-medium mb-5">COMPANY</p>
                <ul className="flex flex-col gap-2 text-gray-600">
                    <li>Home</li>
                    <li>About Us</li>
                    <li>Contact Us</li>
                    <li>Privacy Policy</li>
                </ul>

            </div>

            {/* right section */}
            <div>
                <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
                <ul className="flex flex-col gap-2 text-gray-600">
                    <li>+91 9696592179</li>
                    <li>supportcarehive@gmail.com</li>
                </ul>

            </div>
        </div>

        <div>
             {/* Copyright text */}
             <hr/>
             <p className="py-5 font-semibold text-sm text-center">Copyright 2025 @ CareHive - All Rights Reserved.</p>
        </div>


    </div>
  )
}

export default Footer