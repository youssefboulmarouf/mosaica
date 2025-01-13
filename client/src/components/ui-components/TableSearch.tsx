import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface TableSearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const TableSearch: React.FC<TableSearchProps> = ({ searchTerm, setSearchTerm }) => {
    return (
        <TextField
            id="search"
            type="text"
            size="small"
            variant="outlined"
            placeholder="Search"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default TableSearch;
