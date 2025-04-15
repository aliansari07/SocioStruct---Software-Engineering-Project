

import java.util.List;

public class competiton extends Entity {

	/**
	 * 
	 */
	public Integer c_fees;
	/**
	 * 
	 */
	public List<Competitionparticipants> competitionparticipants;
	/**
	 * Getter of c_fees
	 */
	public Integer getC_fees() {
	 	 return c_fees; 
	}
	/**
	 * Setter of c_fees
	 */
	public void setC_fees(Integer c_fees) { 
		 this.c_fees = c_fees; 
	}
	/**
	 * Getter of competitionparticipants
	 */
	public List<Competitionparticipants> getCompetitionparticipants() {
	 	 return competitionparticipants; 
	}
	/**
	 * Setter of competitionparticipants
	 */
	public void setCompetitionparticipants(List<Competitionparticipants> competitionparticipants) { 
		 this.competitionparticipants = competitionparticipants; 
	} 

}