import { useDispatch, useSelector } from "react-redux";
import {
  openAdditionModal,
  selectEditorData,
  closeAdditionModal,
  selectParcelData,
  selectSurfaces,
  selectAdditionModalState,
  addNewLayer
} from "../../../redux/slices/calcSlice";
import styles from "./Editor.module.scss";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Modal from "../../../components/Modal/Modal";
import LoadingButton from "@mui/lab/LoadingButton";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import TextField from '@mui/material/TextField';
import { useState } from "react";
import Layer from "./Layer";

function Editor(props) {
  const editorData = useSelector(selectEditorData);
  const parcelData = useSelector(selectParcelData);
  const additionModalState = useSelector(selectAdditionModalState);
  const surfaces = useSelector(selectSurfaces);
  const dispatch = useDispatch();

  const [localSurfaceSelection, setLocalSurfaceSeletion] = useState(Object.keys(surfaces).length > 0 ? Object.keys(surfaces)[0] : '');
    const [localSurfaceOwnName, setLocalSurfaceOwnName] = useState('');

  const handleModalOpen = () => {
    dispatch(openAdditionModal());
  };

  const handleOwnNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSurfaceOwnName(event.target.value);
  }

  const handleModalClose = () => {
    dispatch(closeAdditionModal());
  };

  const handleAddLayer = () => {
    dispatch(addNewLayer({
        polygon: [],
        surfaceType: localSurfaceSelection,
        color: surfaces[localSurfaceSelection].color,
        ownName: localSurfaceOwnName
    }))
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    console.log(event.target)
    setLocalSurfaceSeletion(event.target.value);
  };

  const additionModal = (
    <Modal
      closeModal={handleModalClose}
      title="Stwórz nową warstwę"
      visible={additionModalState}
      height={300}
      noBodyPadding
    >
      <div className={styles.additionModalBody}>
        <div className={styles.inputs}>
            <div className={styles.surfaceTypeSelection}>
            <div style={{backgroundColor: `${surfaces[localSurfaceSelection] ? surfaces[localSurfaceSelection].color : ""}`}} className={styles.currentColorContainer}>

            </div>
          <FormControl fullWidth>
            <InputLabel>Rodzaj powierzchni</InputLabel>
            <Select
              sx={{width: '20rem'}}
              label="Rodzaj powierzchni"
              value={localSurfaceSelection}
              onChange={handleSelectChange}
            >
              {Object.keys(surfaces).map((key) => (
                <MenuItem value={key}>{surfaces[key].name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          </div>
          <div className={styles.surfaceOwnName}>
                <TextField onChange={handleOwnNameChange} fullWidth label='Nazwa własna powierzchni'  variant='outlined'/>
          </div>
        </div>
        <div className={styles.buttons}>
          <LoadingButton
            onClick={handleAddLayer}
            color="primary"
            variant="contained"
          >
            Dodaj
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            onClick={handleModalClose}
            color="red"
          >
            Anuluj
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className={styles.editorContainer}>
      <div className={styles.header}>
        <div className={styles.intro}>Wybrana działka</div>
        <div className={styles.parcelInfo}>
          <div className={styles.parcelRegion}>{parcelData.parcelRegion}</div>
          <div className={styles.parcelNumber}>{parcelData.parcelNumber}</div>
        </div>
      </div>

      <div className={styles.layers}>
        <div className={styles.buttons}>
          <Button
            onClick={handleModalOpen}
            startIcon={<AddIcon />}
            fullWidth
            color="primary"
            variant="outlined"
          >
            Dodaj warstwę
          </Button>
        </div>

        <div className={styles.items}>

            {editorData.layers.map((layer, index) => (
                <Layer key={index} index={index} layer={layer}/>
            ))}


        </div>
      </div>

      {additionModal}
    </div>
  );
}

export default Editor;