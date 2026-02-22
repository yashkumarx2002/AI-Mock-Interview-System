const Button = (props) => {
  return (
    <button className="px-4 py-2  bg-black text-white text-sm rounded-md font-normal cursor-pointer hover:bg-neutral-800" onClick={props.onclick}>
      {props.text}
    </button>
  )
}

export default Button