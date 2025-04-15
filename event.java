

import java.util.List;

public class event extends Entity {

	/**
	 * 
	 */
	public eventattendee eventattendee;
	/**
	 * 
	 */
	public List<competiton> competiton;
	/**
	 * Getter of eventattendee
	 */
	public eventattendee getEventattendee() {
	 	 return eventattendee; 
	}
	/**
	 * Setter of eventattendee
	 */
	public void setEventattendee(eventattendee eventattendee) { 
		 this.eventattendee = eventattendee; 
	}
	/**
	 * Getter of competiton
	 */
	public List<competiton> getCompetiton() {
	 	 return competiton; 
	}
	/**
	 * Setter of competiton
	 */
	public void setCompetiton(List<competiton> competiton) { 
		 this.competiton = competiton; 
	} 

}