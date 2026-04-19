import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import { Form, Button } from 'react-bootstrap';
import { CloseOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import InputMask from 'react-input-mask';

// --- Animations ---
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
`;

// --- Styled Components ---
const StyledModal = styled(Modal)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #f0f2f5;
  outline: none;
  padding: 25px;
  border-radius: 8px;
  width: 550px;
  max-width: 90%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  font-family: 'Roboto', sans-serif;
  color: #1a1f36;
  height: auto;
  max-height: 90vh;
  animation: ${props => props.isOpen ? fadeIn : fadeOut} 0.3s ease;
`;

const CloseButton = styled(CloseOutlined)`
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 24px;
  color: #5469d4;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #212d63;
  }
`;

const StyledFormLabel = styled(Form.Label)`
  margin-bottom: 8px;
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1a1f36;
  text-align: left;
`;

const CallButton = styled.button`
  background-color: #5469d4;
  color: white;
  border: none;
  width: ${({ width }) => width || 'auto'};
  height: ${({ height }) => height || 'auto'};
  cursor: pointer;
  font-size: ${({ fontSize }) => fontSize || '1rem'};
  transition: background-color 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  line-height: 1.5;
  border-radius: 4px;
  padding: ${({ padding }) => padding || '0.5rem 1rem'};

  &:hover {
    background-color: #212d63;
  }
`;

const StyledFormControl = styled(Form.Control)`
  font-size: 16px;
  line-height: 1.5;
  padding: 8px;
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 4px;
  outline: none;
  background-color: white;
  color: #1a1f36;
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #5469d4;
    box-shadow: 0 0 0 2px rgba(84, 105, 212, 0.2);
  }
`;

const StyledOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  animation: ${props => props.isOpen ? 'fadeInOverlay' : 'fadeOutOverlay'} 0.3s ease;

  @keyframes fadeInOverlay {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOutOverlay {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

const FormContent = React.memo(
  ({
    fullName,
    setFullName,
    phone,
    setPhone,
    phoneError,
    setPhoneError,
    handleSubmit,
  }) => (
    <Form onSubmit={handleSubmit} style={{ width: '100%', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '10px', color: '#1a1f36', fontSize: '24px' }}>Заказать звонок</h2>
      <p style={{ fontSize: '16px', color: '#697386', marginBottom: '24px' }}>
        Наши специалисты свяжутся с Вами в течение получаса
      </p>
      <Form.Group controlId="formBasicFullName" style={{ textAlign: 'left', marginBottom: '16px' }}>
        <StyledFormLabel>ФИО</StyledFormLabel>
        <StyledFormControl
          type="text"
          placeholder="Ваше ФИО"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group controlId="formBasicPhone" style={{ textAlign: 'left', marginBottom: '16px' }}>
        <StyledFormLabel>Телефон</StyledFormLabel>
        <InputMask
          mask="+7 (999) 999-99-99"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setPhoneError(false);
          }}
          required
        >
          {(inputProps) => <StyledFormControl {...inputProps} type="tel" placeholder="+7 (___) ___ __ __" />}
        </InputMask>
        {phoneError && (
          <Form.Text className="text-danger" style={{ textAlign: 'left', marginTop: '4px' }}>
            Пожалуйста, введите корректный номер телефона.
          </Form.Text>
        )}
      </Form.Group>

      <div style={{ marginTop: '24px' }}>
        <Button variant="primary" type="submit" style={{
          backgroundColor: '#5469d4',
          borderColor: '#5469d4',
          color: 'white',
          fontWeight: '600',
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '16px',
          transition: 'background-color 0.2s ease',
        }}
          onMouseOver={(e) => { e.target.style.backgroundColor = '#212d63'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = '#5469d4'; }}
        >
          Отправить
        </Button>
      </div>
    </Form>
  )
);


const ContactInfo = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);

  const openModal = useCallback(() => {
      setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
      setIsModalOpen(false);
      setFullName('');
      setPhone('');
      setPhoneError(false);
  }, []);

  const handleSubmit = useCallback(
      async (e) => {
          e.preventDefault();

          const cleanedPhone = phone.replace(/\D/g, '');
          if (cleanedPhone.length !== 11 || cleanedPhone[0] !== '7') {
              setPhoneError(true);
              return;
          }

          try {
              const response = await axios.post('${API_BASE_URL}/api/send-message', {
                  fullName: fullName,
                  phone: phone,
              });

              alert(response.data.message);
              closeModal();

          } catch (error) {
              console.error('Ошибка отправки сообщения:', error);

              if (error.response) {
                  // --- **Изменение:** Более конкретное сообщение об ошибке сервера ---
                  alert(`Ошибка сервера: ${error.response.status} - ${error.response.data.error || 'Неизвестная ошибка сервера'}`);
              } else if (error.request) {
                  // --- **Изменение:**  Сообщение о сетевой ошибке с подсказкой проверить интернет ---
                  alert('Ошибка сети: нет ответа от сервера. Проверьте ваше интернет-соединение.');
              } else {
                  // --- **Изменение:** Общее сообщение с намеком на проблемы с сетью/прокси ---
                  alert('Произошла ошибка при отправке запроса. Возможно, проблема с сетью или прокси-сервером.');
              }
          }
      },
      [fullName, phone, closeModal]
  );
  
  return (
    <div>
      <CallButton
        width="150px"
        height="60px"
        padding="0.5rem 1rem"
        fontSize="1rem"
        onClick={openModal}
      >
        Заказать звонок
      </CallButton>

      <StyledModal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Заказать звонок"
        ariaHideApp={false}
        overlayElement={(props, contentElement) => <StyledOverlay isOpen={isModalOpen} {...props}>{contentElement}</StyledOverlay>} // Custom overlay
      >
        <CloseButton onClick={closeModal} />
        <FormContent
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          phoneError={phoneError}
          setPhoneError={setPhoneError}
          handleSubmit={handleSubmit}
        />
      </StyledModal>
    </div>
  );
});

export default ContactInfo;
