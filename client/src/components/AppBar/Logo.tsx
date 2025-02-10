import { Link } from "react-router-dom";
import { styled } from "@mui/material/styles";

interface LogoProps {
    handleMenuClose: () => void;
}

const Logo: React.FC<LogoProps> = ({ handleMenuClose }) => {
    const LinkStyled = styled(Link)(() => ({
        height: 70,
        width: "180px",
        overflow: "hidden",
        display: "block",
    }));

    return (
        <LinkStyled to="/" onClick={handleMenuClose}>
            <img
                src="/images/logos/header-logo.svg"
                alt="logo"
                height={70}
                width={174}
            />
        </LinkStyled>
    );
};

export default Logo;
